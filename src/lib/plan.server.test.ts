// @vitest-environment node

import { describe, expect, it } from "vitest";
import { generatePlanOptions, validatePlanOptions, type PlanInput } from "./plan.server";

process.env["EVENTIFY_DB_PATH"] = ":memory:";

const option = (theme: string) => ({
  theme,
  people: "About 100 guests",
  venue: "Main auditorium",
  activities: "Opening act; live music; closing",
  decoration: "Reusable themed decorations",
  budget: "₹50,000 total: venue ₹20,000, activities ₹30,000",
});

describe("validatePlanOptions", () => {
  it("accepts exactly three distinct, complete event plans", () => {
    expect(
      validatePlanOptions({
        options: [option("Retro Rewind"), option("Global Fiesta"), option("Bollywood Night")],
      }),
    ).toHaveLength(3);
  });

  it("rejects a response with fewer than three plans", () => {
    expect(() =>
      validatePlanOptions({ options: [option("Retro Rewind"), option("Global Fiesta")] }),
    ).toThrow();
  });

  it("rejects repeated theme names", () => {
    expect(() =>
      validatePlanOptions({
        options: [option("Retro Rewind"), option("retro rewind"), option("Bollywood Night")],
      }),
    ).toThrow("three distinct themes");
  });

  it("rejects plans missing a required field", () => {
    const incomplete = { ...option("Retro Rewind"), venue: "" };
    expect(() =>
      validatePlanOptions({
        options: [incomplete, option("Global Fiesta"), option("Bollywood Night")],
      }),
    ).toThrow();
  });
});

describe("generatePlanOptions", () => {
  const input: PlanInput = {
    name: "Campus Night",
    description: "An evening celebration with music and performances.",
    eventType: "College festival",
    budget: "₹50,000",
    attendees: 120,
    location: "Pune",
    eventTime: "2026-12-10T18:00:00.000Z",
    durationHours: 4,
    catering: true,
  };

  it("generates three distinct plans from the local SQLite template catalog", async () => {
    const options = await generatePlanOptions(input);

    expect(options).toHaveLength(3);
    expect(new Set(options.map((plan) => plan.theme.split(" — ")[0])).size).toBe(3);
    expect(options.every((plan) => plan.theme.includes("Campus Night"))).toBe(true);
    expect(options.every((plan) => plan.theme.includes("College festival"))).toBe(true);
    expect(options.every((plan) => plan.venue.includes("Pune"))).toBe(true);
    expect(options.every((plan) => plan.people.includes("120 total capacity"))).toBe(true);
    expect(options.every((plan) => plan.budget.includes("₹50,000 total"))).toBe(true);
  });

  it("removes catering allocation when catering is not requested", async () => {
    const options = await generatePlanOptions({ ...input, catering: false });

    expect(options).toHaveLength(3);
    expect(options.every((plan) => !plan.theme.includes("Food Festival"))).toBe(true);
    expect(options.every((plan) => !plan.theme.toLowerCase().includes("food"))).toBe(true);
    expect(options.every((plan) => !plan.budget.includes("food and catering"))).toBe(true);
    expect(options.every((plan) => !plan.activities.includes("with catering breaks"))).toBe(true);
  });

  it("generates plans even when the budget is descriptive instead of numeric", async () => {
    const options = await generatePlanOptions({ ...input, budget: "Flexible student budget" });

    expect(options).toHaveLength(3);
    expect(options.every((plan) => plan.budget.includes("Flexible student budget"))).toBe(true);
  });
});
