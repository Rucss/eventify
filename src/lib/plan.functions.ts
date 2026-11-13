import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCurrentUser } from "./local-db.server";
import { generatePlanOptions } from "./plan.server";

const inputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  eventType: z.string().max(200),
  budget: z.string().max(100),
  attendees: z.number().int().min(0).max(1000000),
  location: z.string().max(300),
  eventTime: z.string().max(100),
  durationHours: z.number().min(0).max(1000),
  catering: z.boolean(),
});

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    await requireCurrentUser();
    try {
      const options = await generatePlanOptions(data);
      if (options.length !== 3) {
        throw new Error("The event planner returned an incomplete set of options.");
      }
      return { options, error: null as string | null };
    } catch (e) {
      return { options: [], error: e instanceof Error ? e.message : "Something went wrong" };
    }
  });
