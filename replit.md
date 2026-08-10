# Cleo & Leo Telegram Bot

## Overview

This is a Next.js Telegram webhook bot for Cleo & Leo channels. The Replit workflow runs `npm run dev` on port 5000.

## Run

```bash
npm install
npm run dev
```

Set `TELEGRAM_BOT_TOKEN` as a Replit Secret before using Telegram features. Use the Set Webhook button in the app once the preview has a public HTTPS URL.

## Project preferences

- Keep the existing Next.js pages-router structure.
- Telegram must remain webhook-only; do not add polling or `getUpdates`.
- Add channels only to the central configuration in `lib/channels.ts`.
- Keep user-facing text and documentation in English.