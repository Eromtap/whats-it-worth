# What's It Worth

Vue MVP for a household inventory and local marketplace app.

## What it does

- create a local account in the browser
- track inventory items with category, room, condition, notes, and photo counts
- generate a valuation range and confidence score per item
- review sold comp snapshots for owned items
- publish inventory items as marketplace listings
- keep items private while still accepting blind offers
- manage incoming and outgoing offers in an inbox
- persist all state in browser `localStorage`

## Run it

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## Current architecture

- `src/composables/useAppState.js`: local app state, persistence, and actions
- `src/lib/seed.js`: seeded demo users, items, listings, offers, and valuation helpers
- `src/components/`: auth, inventory, valuation, marketplace, inbox, and header views
- `src/App.vue`: screen orchestration

## Important limitation

This is still a client-side MVP. It does not yet include:

- hosted auth
- real cloud image uploads
- live eBay or market comp ingestion
- payments
- server-side privacy rules or moderation

## Recommended next phase

1. Move auth, storage, and database to Supabase.
2. Add image upload and item photo galleries.
3. Add a real valuation service that stores comp snapshots server-side.
4. Add item-level privacy controls enforced by row-level security.
5. Add messaging, moderation, and transaction workflows for marketplace activity.
