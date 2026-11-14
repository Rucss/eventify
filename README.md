# Eventify

Eventify is an event management app with email/password accounts, event listings, registrations, profiles, and a local event-plan generator.

## Requirements

- Node.js 22.12 or newer
- npm

## Run locally

```sh
npm install
npm run dev
```

Without Turso environment variables, the app creates `data/eventify.sqlite` on first use. Set `EVENTIFY_DB_PATH` to use a different local database file. The SQLite file contains account password hashes, sessions, profiles, events, and registrations; keep it private and do not commit it.

The sign-in and registration pages are hidden. On first visit, Eventify creates a guest profile for that browser automatically, so visitors can use the profile, create events, generate local plan options, and register for events without creating an account. Guest profiles and their data are tied to the browser's session cookie; clearing site data or switching browsers starts a separate guest profile. Supabase is not used.

## Deploy with Turso

The local SQLite file is for development only. Vercel's deployment filesystem is not a persistent database, so configure a remote Turso database before deploying:

1. Sign in to Turso and create a libSQL database and token using the [Turso CLI](https://docs.turso.tech/quickstart):

   ```sh
   turso auth login
   turso db create eventify
   turso db show eventify
   turso db tokens create eventify
   ```

   Use the database URL shown by `turso db show` and the token printed by the last command.

2. In Vercel, open the Eventify project and go to **Settings → Environment Variables**.
3. Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` for the Production environment. Keep both server-side; do not use a `VITE_` prefix.
4. Confirm the Vercel project is connected to the repository containing this code, then redeploy.

The app creates the existing Eventify tables and plan templates in Turso on the first database request. Existing records in a local `data/eventify.sqlite` file are not copied automatically.

## Event-plan generator

Generated plans are selected at random from the seeded `event_plan_templates` table in the configured SQLite or Turso database. The selected templates are tailored to the event's type, budget, audience size, location, date, duration, and catering preference. No LLM service, API key, or external request is needed.

## Checks

```sh
npm test
npm run build
```
