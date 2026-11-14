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

## Manage live events with JSON

The live site uses [`data/events.json`](./data/events.json) as a read-only event catalog. Edit this file, commit and push the change, then let Vercel redeploy. No Turso account or database environment variables are needed for live event listings.

Add event objects inside the array. Each event uses this shape:

```json
{
  "id": "a unique UUID",
  "created_by": "a unique UUID",
  "name": "Community Festival",
  "description": "An evening of music and food.",
  "event_type": "Festival",
  "budget": "50000",
  "attendees": 300,
  "location": "City Park",
  "event_time": "2027-06-15T18:00:00.000Z",
  "duration_hours": 4,
  "catering": true,
  "image_url": "/events/community-festival.jpg",
  "ai_plan": null,
  "creator": { "full_name": "Event Team" },
  "registrations": []
}
```

Use valid UUIDs for `id`, `created_by`, and each registration's `user_id`. `event_time` must be an ISO date/time. Put image files in `public/` and use their public URL path in `image_url`. Separate multiple event objects with commas, and keep the JSON valid.

The live catalog is read-only: visitors can browse event details, but live event creation, registrations, profiles, and plan generation are not saved. Those workflows remain available for local development. Vercel's deployment filesystem is temporary, so changes made by a visitor cannot be kept as a project file.

## Event-plan generator

During local development, generated plans are selected from the seeded `event_plan_templates` table in SQLite. The selected templates are tailored to the event's type, budget, audience size, location, date, duration, and catering preference. No LLM service, API key, or external request is needed.

## Checks

```sh
npm test
npm run build
```
