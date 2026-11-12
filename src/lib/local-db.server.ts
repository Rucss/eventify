import { randomBytes, randomUUID, scryptSync, createHash, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync, type SQLOutputValue } from "node:sqlite";
import {
  deleteCookie,
  getCookie,
  getRequestProtocol,
  setCookie,
} from "@tanstack/react-start/server";
import type { Profile, User } from "./local-types";

const SESSION_COOKIE = "eventify_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

let database: DatabaseSync | undefined;

export function getDatabase(): DatabaseSync {
  if (database) return database;

  const filename =
    process.env["EVENTIFY_DB_PATH"] || join(process.cwd(), "data", "eventify.sqlite");
  if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true });

  database = new DatabaseSync(filename, { timeout: 5000 });
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL DEFAULT '',
      phone TEXT,
      address TEXT,
      bio TEXT,
      gender TEXT,
      dob TEXT,
      avatar_url TEXT,
      email_notifications INTEGER NOT NULL DEFAULT 1,
      push_notifications INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      created_by TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      event_type TEXT NOT NULL DEFAULT '',
      budget TEXT NOT NULL DEFAULT '',
      attendees INTEGER NOT NULL DEFAULT 0,
      location TEXT NOT NULL DEFAULT '',
      event_time TEXT NOT NULL,
      duration_hours REAL NOT NULL DEFAULT 1,
      catering INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      ai_plan TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS event_plan_templates (
      id TEXT PRIMARY KEY,
      theme TEXT NOT NULL,
      concept TEXT NOT NULL,
      audience TEXT NOT NULL,
      venue TEXT NOT NULL,
      activities TEXT NOT NULL,
      decoration TEXT NOT NULL,
      budget_splits TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions(user_id);
    CREATE INDEX IF NOT EXISTS registrations_user_id_idx ON registrations(user_id);
    CREATE INDEX IF NOT EXISTS events_event_time_idx ON events(event_time);
  `);

  const planTemplates = [
    {
      id: "retro-rewind",
      theme: "Retro Rewind",
      concept: "A colorful throwback celebration with classic music, games, and photo moments",
      audience: "Invite guests to dress for their favorite decade",
      venue: "Auditorium or community hall with a dance floor",
      activities: "Decade-themed fashion walk; retro music quiz; dance-offs; instant-photo booth",
      decoration: "Vinyl-style signs, bold geometric backdrops, warm string lights, and reusable props",
      budgetSplits: { venue: 0.2, production: 0.18, food: 0.24, decor: 0.12, activities: 0.21, contingency: 0.05 },
    },
    {
      id: "global-fiesta",
      theme: "Global Fiesta",
      concept: "A welcoming cultural fair celebrating music, food, and traditions from around the world",
      audience: "Organize guests into cultural showcase groups and roaming visitors",
      venue: "Open courtyard or covered exhibition space",
      activities: "Culture booths; world-music performances; passport stamp trail; group dance lesson",
      decoration: "Colorful country-inspired booth signs, fabric bunting, and clearly labeled reusable displays",
      budgetSplits: { venue: 0.17, production: 0.16, food: 0.28, decor: 0.13, activities: 0.21, contingency: 0.05 },
    },
    {
      id: "starlight-social",
      theme: "Starlight Social",
      concept: "An evening gathering with relaxed live entertainment and an outdoor festival atmosphere",
      audience: "Plan seating and standing areas for a mixed-age evening audience",
      venue: "Garden lawn, rooftop terrace, or open-air amphitheatre",
      activities: "Acoustic music set; open-mic performances; lawn games; community photo corner",
      decoration: "Warm string lighting, lantern-style LED lights, simple stage signage, and picnic seating",
      budgetSplits: { venue: 0.18, production: 0.24, food: 0.2, decor: 0.13, activities: 0.2, contingency: 0.05 },
    },
    {
      id: "neon-arcade",
      theme: "Neon Arcade",
      concept: "A high-energy game night with team challenges and a bright arcade-inspired look",
      audience: "Create rotating teams so every guest can take part",
      venue: "Multipurpose hall with space for activity stations",
      activities: "Team trivia; console-game bracket; giant board games; cooperative puzzle challenge",
      decoration: "LED accent lighting, vivid station signs, high-contrast table covers, and reusable game props",
      budgetSplits: { venue: 0.18, production: 0.18, food: 0.2, decor: 0.15, activities: 0.24, contingency: 0.05 },
    },
    {
      id: "garden-gathering",
      theme: "Garden Gathering",
      concept: "A relaxed, nature-inspired celebration focused on conversation and hands-on activities",
      audience: "Offer quiet seating alongside open areas for groups and families",
      venue: "Botanical garden, campus green, or landscaped courtyard",
      activities: "Guided garden walk; planting workshop; acoustic corner; nature-themed scavenger hunt",
      decoration: "Potted plants, recycled-paper signs, soft fabric table runners, and reusable wooden displays",
      budgetSplits: { venue: 0.2, production: 0.12, food: 0.24, decor: 0.14, activities: 0.29, contingency: 0.05 },
    },
    {
      id: "cinema-under-stars",
      theme: "Cinema Under the Stars",
      concept: "An outdoor movie experience with comfortable seating and a pre-show social hour",
      audience: "Arrange flexible seating zones for groups, couples, and accessible viewing",
      venue: "Open lawn or courtyard with a safe projection area",
      activities: "Audience-choice screening; movie soundtrack quiz; themed photo spot; interval snack counter",
      decoration: "Cinema-style entrance signs, soft pathway lights, blankets, and reusable film-themed props",
      budgetSplits: { venue: 0.15, production: 0.3, food: 0.22, decor: 0.1, activities: 0.2, contingency: 0.07 },
    },
    {
      id: "makers-market",
      theme: "Makers Market",
      concept: "A creative pop-up showcasing local makers, student projects, and interactive demonstrations",
      audience: "Balance vendor teams, demonstration groups, and browsing visitors",
      venue: "Indoor exhibition hall or covered market space",
      activities: "Maker stalls; short live demonstrations; hands-on craft table; visitor-choice awards",
      decoration: "Handwritten-style stall labels, modular tables, recycled display boards, and clear wayfinding",
      budgetSplits: { venue: 0.18, production: 0.14, food: 0.18, decor: 0.14, activities: 0.32, contingency: 0.08 },
    },
    {
      id: "sports-day-showdown",
      theme: "Sports Day Showdown",
      concept: "A friendly team tournament that mixes active games with inclusive spectator challenges",
      audience: "Make teams with players, substitutes, volunteers, and a spectator section",
      venue: "Sports ground or indoor court with nearby shaded seating",
      activities: "Relay races; mixed-team mini matches; skills stations; team spirit awards",
      decoration: "Color-coded team flags, simple scoreboards, reusable pennants, and shaded rest zones",
      budgetSplits: { venue: 0.22, production: 0.16, food: 0.2, decor: 0.1, activities: 0.3, contingency: 0.06 },
    },
    {
      id: "bollywood-bonanza",
      theme: "Bollywood Bonanza",
      concept: "A lively film-inspired celebration featuring music, performance, and shared sing-along moments",
      audience: "Include performers, supporting crew, and guests in the audience plan",
      venue: "Auditorium or event hall with a small performance stage",
      activities: "Film-song medley; dance showcase; soundtrack guessing game; audience-request finale",
      decoration: "Colorful film-inspired posters, marquee-style LED signs, and reusable photo backdrops",
      budgetSplits: { venue: 0.18, production: 0.24, food: 0.21, decor: 0.14, activities: 0.23 },
    },
    {
      id: "food-festival",
      theme: "Food Festival",
      concept: "A tasting-focused gathering with local flavors, live demonstrations, and shared tables",
      audience: "Plan staggered tasting groups, food vendors, and clear dietary information",
      venue: "Covered courtyard or food-hall style venue",
      activities: "Local tasting trail; chef demonstration; recipe card exchange; community-choice dish",
      decoration: "Reusable menu boards, color-coded dietary labels, market-style table signs, and shared seating",
      budgetSplits: { venue: 0.14, production: 0.12, food: 0.4, decor: 0.1, activities: 0.19, contingency: 0.05 },
    },
    {
      id: "science-after-hours",
      theme: "Science After Hours",
      concept: "An interactive discovery night with hands-on demonstrations and accessible science activities",
      audience: "Use small rotating groups and reserve space for demonstrators and helpers",
      venue: "Science center, campus atrium, or multipurpose hall",
      activities: "Hands-on experiment stations; science quiz; short expert talks; build-and-test challenge",
      decoration: "Clear experiment labels, bright station markers, reusable display boards, and safe task lighting",
      budgetSplits: { venue: 0.17, production: 0.2, food: 0.16, decor: 0.1, activities: 0.32, contingency: 0.05 },
    },
    {
      id: "cozy-boardgame-cafe",
      theme: "Cozy Boardgame Café",
      concept: "A low-key social meetup built around tabletop games, conversation, and comfort food",
      audience: "Set up small tables with beginner-friendly games and a quieter seating area",
      venue: "Café, lounge, or library common room",
      activities: "Board-game rotation; cooperative puzzle table; quick card-game tournament; host-led icebreakers",
      decoration: "Table lamps, simple menu cards, soft fabric accents, and labeled game shelves",
      budgetSplits: { venue: 0.15, production: 0.1, food: 0.28, decor: 0.08, activities: 0.34, contingency: 0.05 },
    },
  ];

  const insertTemplate = database.prepare(
    `INSERT OR IGNORE INTO event_plan_templates
      (id, theme, concept, audience, venue, activities, decoration, budget_splits)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const template of planTemplates) {
    insertTemplate.run(
      template.id,
      template.theme,
      template.concept,
      template.audience,
      template.venue,
      template.activities,
      template.decoration,
      JSON.stringify(template.budgetSplits),
    );
  }

  return database;
}

function readText(row: Record<string, SQLOutputValue>, key: string): string {
  const value = row[key];
  if (typeof value !== "string") throw new Error(`Invalid local database value for ${key}`);
  return value;
}

function readNullableText(row: Record<string, SQLOutputValue>, key: string): string | null {
  const value = row[key];
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`Invalid local database value for ${key}`);
  return value;
}

function toProfile(row: Record<string, SQLOutputValue>): Profile {
  const emailNotifications = row["email_notifications"];
  const pushNotifications = row["push_notifications"];
  if (typeof emailNotifications !== "number" || typeof pushNotifications !== "number") {
    throw new Error("Invalid local database notification preferences");
  }

  return {
    id: readText(row, "id"),
    full_name: readText(row, "full_name"),
    email: readText(row, "email"),
    phone: readNullableText(row, "phone"),
    address: readNullableText(row, "address"),
    bio: readNullableText(row, "bio"),
    gender: readNullableText(row, "gender"),
    dob: readNullableText(row, "dob"),
    avatar_url: readNullableText(row, "avatar_url"),
    email_notifications: emailNotifications === 1,
    push_notifications: pushNotifications === 1,
  };
}

export function getProfile(userId: string): Profile | null {
  const row = getDatabase()
    .prepare(
      `SELECT id, full_name, email, phone, address, bio, gender, dob, avatar_url,
              email_notifications, push_notifications
       FROM profiles WHERE id = ?`,
    )
    .get(userId);
  return row ? toProfile(row) : null;
}

export function findUserByEmail(
  email: string,
): (User & { password_salt: string; password_hash: string }) | null {
  const row = getDatabase()
    .prepare("SELECT id, email, password_salt, password_hash FROM profiles WHERE email = ?")
    .get(email);
  if (!row) return null;
  return {
    id: readText(row, "id"),
    email: readText(row, "email"),
    password_salt: readText(row, "password_salt"),
    password_hash: readText(row, "password_hash"),
  };
}

export function createAccount(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string | null;
  address: string | null;
}): User {
  const salt = randomBytes(16).toString("hex");
  const passwordHash = scryptSync(input.password, salt, 64).toString("hex");
  const user = { id: randomUUID(), email: input.email };
  getDatabase()
    .prepare(
      `INSERT INTO profiles (id, email, password_salt, password_hash, full_name, phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(user.id, user.email, salt, passwordHash, input.fullName, input.phone, input.address);
  return user;
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(userId: string): void {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const db = getDatabase();
  db.prepare("DELETE FROM auth_sessions WHERE expires_at <= ?").run(Date.now());
  db.prepare("INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    hashSessionToken(token),
    userId,
    expiresAt,
  );
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: getRequestProtocol() === "https",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSession(): void {
  const token = getCookie(SESSION_COOKIE);
  if (token)
    getDatabase()
      .prepare("DELETE FROM auth_sessions WHERE token_hash = ?")
      .run(hashSessionToken(token));
  deleteCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: getRequestProtocol() === "https",
    path: "/",
  });
}

export function currentUser(): User | null {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const row = getDatabase()
    .prepare(
      `SELECT p.id, p.email FROM auth_sessions s
       JOIN profiles p ON p.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashSessionToken(token), Date.now());
  if (!row) return null;
  return { id: readText(row, "id"), email: readText(row, "email") };
}

export function requireCurrentUser(): User {
  const user = currentUser();
  if (!user) throw new Error("Please sign in to continue.");
  return user;
}
