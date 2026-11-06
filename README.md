# Relay

An adherence platform for teen kidney-transplant patients. [BUILD_GUIDE.md](BUILD_GUIDE.md) is the source of truth, and [CLAUDE.md](CLAUDE.md) has the project rules.

## Setup

```
npm install
cp .env.local.example .env.local   # then add your Supabase keys
npm run dev
```

The project uses a hosted Supabase project, so Docker is not needed. To work on the schema, link once with `npx supabase login` and `npx supabase link --project-ref <ref>`, then use `npm run db:push` and `npm run db:types`.

## Checks

```
npm run typecheck && npm run lint && npm test
```
