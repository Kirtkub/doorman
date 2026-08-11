# Cleo & Leo Telegram Bot

## Overview

This is a Next.js Telegram webhook bot and join-statistics dashboard for Cleo & Leo channels. The Replit workflow runs `npm run dev` on port 5000.

## Run

```bash
npm install
npm run dev
```

Set `TELEGRAM_BOT_TOKEN` as a Replit Secret before using Telegram features. Use the Set Webhook button in the app once the preview has a public HTTPS URL.

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for join-event storage and dashboard statistics. Approved join requests are stored in the `cleo_leo:join_events` sorted set.

## Project preferences

- Keep the existing Next.js pages-router structure.
- Telegram must remain webhook-only; do not add polling or `getUpdates`.
- Add channels only to the central configuration in `lib/channels.ts`.
- Keep user-facing text and documentation in English.
- Keep dashboard aggregation server-side and use one Redis range read per statistics request.