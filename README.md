# Relay

An adherence platform for teen kidney-transplant patients. [BUILD_GUIDE.md](BUILD_GUIDE.md) is the source of truth, and [CLAUDE.md](CLAUDE.md) has the project rules.

## Setup

```
npm install
cp .env.local.example .env.local   # then add your Supabase keys
npm run dev
```

Local Supabase (`npx supabase start`) needs Docker.

## Checks

```
npm run typecheck && npm run lint && npm test
```
