# Eventify

Eventify is an event management app with email/password accounts, event listings, registrations, profiles, and a local event-plan generator.

## Requirements

- Node.js 22.5 or newer (the local database uses the built-in `node:sqlite` module)
- npm

## Run locally

```sh
npm install
npm run dev
```

The app creates `data/eventify.sqlite` on first use. Set `EVENTIFY_DB_PATH` to use a different local database file. The SQLite file contains account password hashes, sessions, profiles, events, and registrations; keep it private and do not commit it.

Create an account from the sign-in page. Google sign-in and email confirmation are not used.

## Event-plan generator

Generated plans are selected at random from the seeded `event_plan_templates` table in the local SQLite database. The selected templates are tailored to the event's type, budget, audience size, location, date, duration, and catering preference. No LLM service, API key, or external request is needed.

## Checks

```sh
npm test
npm run build
```
