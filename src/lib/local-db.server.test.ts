// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { getDatabase } from "./local-db.server";

const originalEnvironment = {
  nodeEnv: process.env["NODE_ENV"],
  vercel: process.env["VERCEL"],
  databaseUrl: process.env["TURSO_DATABASE_URL"],
  authToken: process.env["TURSO_AUTH_TOKEN"],
};

afterEach(() => {
  for (const [key, value] of Object.entries({
    NODE_ENV: originalEnvironment.nodeEnv,
    VERCEL: originalEnvironment.vercel,
    TURSO_DATABASE_URL: originalEnvironment.databaseUrl,
    TURSO_AUTH_TOKEN: originalEnvironment.authToken,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("production database configuration", () => {
  it("fails clearly instead of trying to create a local database on Vercel", async () => {
    process.env["VERCEL"] = "1";
    delete process.env["TURSO_DATABASE_URL"];
    delete process.env["TURSO_AUTH_TOKEN"];

    await expect(getDatabase().prepare("SELECT 1").get()).rejects.toThrow(
      "Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN",
    );
  });
});
