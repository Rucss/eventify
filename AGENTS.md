# Project Guidelines

- Do not edit generated files directly; use the tool that generates them.
- Do not change database schema or migration files without explicit approval.
- Keep secrets in server-side environment variables and never expose them in browser code.
- Run `npm test`, `npm run build`, and `npx tsc --noEmit` when changing application code.
