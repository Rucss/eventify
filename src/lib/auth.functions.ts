import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  clearSession,
  createAccount,
  createSession,
  currentUser,
  findUserByEmail,
  verifyPassword,
} from "./local-db.server";

const signUpSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(6).max(128),
  phone: z.string().trim().max(40).nullable(),
  address: z.string().trim().max(300).nullable(),
});

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(() => currentUser());

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((data) => signUpSchema.parse(data))
  .handler(({ data }) => {
    try {
      const user = createAccount(data);
      createSession(user.id);
      return { user, error: null };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("UNIQUE constraint failed: profiles.email")
      ) {
        return { user: null, error: "An account with this email already exists." };
      }
      throw error;
    }
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((data) => signInSchema.parse(data))
  .handler(({ data }) => {
    const account = findUserByEmail(data.email);
    if (!account || !verifyPassword(data.password, account.password_salt, account.password_hash)) {
      return { user: null, error: "Invalid email or password." };
    }
    createSession(account.id);
    return { user: { id: account.id, email: account.email }, error: null };
  });

export const signOut = createServerFn({ method: "POST" }).handler(() => {
  clearSession();
  return { success: true };
});
