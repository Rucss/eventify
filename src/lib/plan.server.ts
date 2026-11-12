import { z } from "zod";
import { getDatabase } from "./local-db.server";

export type PlanInput = {
  name: string;
  description: string;
  eventType: string;
  budget: string;
  attendees: number;
  location: string;
  eventTime: string;
  durationHours: number;
  catering: boolean;
};

const optionSchema = z.object({
  theme: z.string().trim().min(1),
  people: z.string().trim().min(1),
  venue: z.string().trim().min(1),
  activities: z.string().trim().min(1),
  decoration: z.string().trim().min(1),
  budget: z.string().trim().min(1),
});
export const planSchema = z.object({ options: z.array(optionSchema).length(3) });
export type PlanOption = z.infer<typeof optionSchema>;

const templateSchema = z.object({
  theme: z.string().trim().min(1),
  concept: z.string().trim().min(1),
  audience: z.string().trim().min(1),
  venue: z.string().trim().min(1),
  activities: z.string().trim().min(1),
  decoration: z.string().trim().min(1),
  budget_splits: z.string(),
});

const budgetSplitSchema = z.record(z.string(), z.number().nonnegative());

function formatCurrency(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function getBudgetBreakdown(budgetText: string, splitsText: string, catering: boolean): string {
  const total = Number(budgetText.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(total) || total <= 0) {
    return `Use the stated budget (${budgetText}) across venue, activities, production, and contingency.`;
  }

  const splits = budgetSplitSchema.parse(JSON.parse(splitsText));
  const categories = Object.entries(splits).filter(
    ([category, weight]) => weight > 0 && (catering || category !== "food"),
  );
  const weightTotal = categories.reduce((sum, [, weight]) => sum + weight, 0);
  if (weightTotal <= 0) throw new Error("Event plan template has no valid budget allocations.");

  const totalAmount = Math.round(total);
  const rawAmounts = categories.map(([, weight]) => (totalAmount * weight) / weightTotal);
  const amounts = rawAmounts.map(Math.floor);
  let remainder = totalAmount - amounts.reduce((sum, amount) => sum + amount, 0);
  const fractionalOrder = rawAmounts
    .map((amount, index) => ({ index, fraction: amount - Math.floor(amount) }))
    .sort((left, right) => right.fraction - left.fraction);
  for (const { index } of fractionalOrder) {
    if (remainder <= 0) break;
    amounts[index] = (amounts[index] ?? 0) + 1;
    remainder -= 1;
  }

  const labels: Record<string, string> = {
    venue: "venue",
    production: "sound and production",
    food: "food and catering",
    decor: "decoration",
    activities: "activities",
    contingency: "contingency",
  };
  const breakdown = categories
    .map(([category], index) => {
      const amount = amounts[index];
      if (amount === undefined) throw new Error("Event plan budget allocation is incomplete.");
      return `${labels[category] ?? category} ${formatCurrency(amount)}`;
    })
    .join("; ");

  return `${formatCurrency(total)} total — ${breakdown}`;
}

function formatEventDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export function validatePlanOptions(value: unknown): PlanOption[] {
  const { options } = planSchema.parse(value);
  const themes = options.map((option) => option.theme.toLowerCase());
  if (new Set(themes).size !== 3) {
    throw new Error("The generated options must have three distinct themes.");
  }
  return options;
}

export async function generatePlanOptions(input: PlanInput): Promise<PlanOption[]> {
  const templates = getDatabase()
    .prepare(
      `SELECT theme, concept, audience, venue, activities, decoration, budget_splits
       FROM event_plan_templates
       WHERE ? = 1 OR id != 'food-festival'
       ORDER BY RANDOM()
       LIMIT 3`,
    )
    .all(input.catering ? 1 : 0);

  if (templates.length !== 3) {
    throw new Error("Not enough event plan templates are available. Please try again.");
  }

  const eventLabel = [input.name.trim(), input.eventType.trim()].filter(Boolean).join(" — ");
  const eventContext = input.description.trim()
    ? ` Event details: ${input.description.trim().slice(0, 240)}`
    : "";
  const attendees = Math.max(1, Math.floor(input.attendees));
  const organizers = Math.min(attendees, Math.max(1, Math.round(attendees * 0.05)));
  const participants = Math.min(attendees - organizers, Math.round(attendees * 0.1));
  const guests = attendees - organizers - participants;
  const eventDate = formatEventDate(input.eventTime);
  const duration = input.durationHours > 0 ? input.durationHours : 1;

  const options = templates.map((row) => {
    const template = templateSchema.parse(row);
    const concept = input.catering
      ? template.concept
      : template.concept.replace(/\bfood\b/gi, "culture");
    const activities = input.catering
      ? template.activities
      : template.activities.replace(/interval snack counter/gi, "themed intermission activity");
    return {
      theme: `${template.theme} — ${concept} for ${eventLabel}.${eventContext}`,
      people: `${attendees} total capacity: ${guests} guests, ${participants} activity participants, and ${organizers} organizers. ${template.audience}.`,
      venue: `Near ${input.location.trim()}: ${template.venue}`,
      activities: `${activities}; schedule for ${eventDate} across ${duration} hours${input.catering ? ", with catering breaks" : ""}.`,
      decoration: template.decoration,
      budget: getBudgetBreakdown(input.budget, template.budget_splits, input.catering),
    };
  });

  return validatePlanOptions({ options });
}
