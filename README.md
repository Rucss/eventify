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

During local development, the app creates `data/eventify.sqlite` on first use. Set `EVENTIFY_DB_PATH` to use a different local database file. The SQLite file contains local account, profile, event, and registration data; keep it private and do not commit it.

The sign-in and registration pages are hidden. In development, Eventify creates a guest profile for that browser automatically, so you can test profiles, event creation, plan generation, and registrations without an account.

## Live event storage

Local development uses SQLite. The live app stores its event catalog as JSON in a **private Vercel Blob store**; it does not use Turso or write into Vercel's temporary project filesystem. Visitors can submit events from **Add Event**. Each browser only sees events submitted from that browser.

To enable live event storage:

1. In the Vercel project, open **Storage → Create Storage → Blob** and create a **private** store.
2. Connect the store to this project for the Production environment (and Preview if you use preview deployments). Vercel's Blob SDK uses the connected project's credentials. If connecting a store outside Vercel, configure `BLOB_READ_WRITE_TOKEN` as a server-only environment variable.
3. Redeploy the project.

The app starts with [`data/events.json`](./data/events.json). When the first live event is submitted, the app copies that seed file into the Blob catalog and adds the new event. Seeded or previously anonymous events do not have a browser owner key, so they are not shown to visitors in private live mode. After the first write, editing the repository's JSON file will not overwrite the live catalog.

Live event submissions do not require an account. Event ownership is tied to a random key in that browser's local storage: events are only returned to requests with the matching key. This is browser-specific rather than account-based, so clearing site data loses access and events cannot be recovered or moved to another browser. Input is validated and the catalog is capped at 500 events. Live registrations, profile editing, and AI plan generation are not enabled. These features remain available against local SQLite during development.

## Event-plan generator

During local development, generated plans are selected from the seeded `event_plan_templates` table in SQLite. The selected templates are tailored to the event's type, budget, audience size, location, date, duration, and catering preference. No LLM service, API key, or external request is needed.

## Checks

```sh
npm test
npm run build
npx tsc --noEmit
```
