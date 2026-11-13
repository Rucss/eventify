import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDatabase, getProfile, requireCurrentUser } from "./local-db.server";

const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().max(40).nullable(),
  dob: z.string().date().nullable(),
  gender: z.enum(["Female", "Male", "Other"]).nullable(),
  address: z.string().max(300).nullable(),
  bio: z.string().max(2000).nullable(),
  avatar_url: z.string().max(2_000_000).nullable(),
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
});

export const fetchProfile = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({}).parse(data))
  .handler(async () => {
    const user = await requireCurrentUser();
    const profile = await getProfile(user.id);
    if (!profile) throw new Error("Profile not found.");
    return profile;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .inputValidator((data) => profileSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireCurrentUser();
    await getDatabase()
      .prepare(
        `UPDATE profiles SET
          full_name = ?, phone = ?, dob = ?, gender = ?, address = ?, bio = ?,
          avatar_url = ?, email_notifications = ?, push_notifications = ?
         WHERE id = ?`,
      )
      .run(
        data.full_name,
        data.phone,
        data.dob,
        data.gender,
        data.address,
        data.bio,
        data.avatar_url,
        data.email_notifications ? 1 : 0,
        data.push_notifications ? 1 : 0,
        user.id,
      );
    return { success: true };
  });
