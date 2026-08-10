# Cleo & Leo Telegram Bot

A webhook-only Telegram bot for Cleo & Leo channels, configured to run on Replit.

## Features

- Automatically approves join requests for configured channels
- Checks current membership in every configured channel when messaged
- Generates channel buttons dynamically from one central configuration
- Uses Telegram webhooks only; there is no polling or `getUpdates`

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the bot token

Add `TELEGRAM_BOT_TOKEN` as a Replit Secret. Never commit the token to source control.

The bot must be an administrator of every configured channel with permission to approve join requests and inspect membership.

### 3. Run locally

```bash
npm run dev
```

The Replit workflow runs the app on port 5000. The app is available in the Replit preview.

### 4. Set the webhook

After the app has a public HTTPS URL, open the app and click **Set Webhook**.

Alternatively, make a POST request to the Telegram Bot API:

```text
POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
{
  "url": "https://your-replit-domain/api/webhook",
  "allowed_updates": ["message", "chat_join_request"]
}
```

The app's **Set Webhook** button constructs the webhook URL from the incoming HTTPS request and configures it automatically.

## Project structure

```text
├── lib/
│   ├── channels.ts        # Single source of truth for channels
│   └── telegram.ts        # Telegram API and safe HTML helpers
├── pages/
│   ├── index.tsx          # Webhook setup page
│   └── api/
│       ├── webhook.ts     # Message and join-request handler
│       └── set-webhook.ts # Webhook configuration endpoint
├── package.json
├── replit.md
└── vercel.json
```

## Channel configuration

Add channels only in `lib/channels.ts`. Each entry contains:

- a display name
- the Telegram chat ID
- the invite link used for joining
- the channel URL used by post-approval links and membership buttons (the supplied invite link is currently the reliable user-facing URL for these private channels)

Membership checks, join-request handling, counts, messages, and buttons all use this array. Adding an entry automatically includes it in every relevant behavior.

## Bot behavior

- A join request for a configured channel is approved automatically. After approval, the bot sends the user the channel-specific congratulations message and an **OPEN CHANNEL** button.
- A message to the bot triggers a fresh membership check for every configured channel.
- Subscribed channels get a `✅` button prefix; channels the user has not joined get a `⚠️➡️` prefix.
- Telegram API failures are logged without crashing the webhook process or exposing technical details to users.

The application is entirely in English from the user's perspective and operates exclusively through webhooks. It does not use long polling or `getUpdates`.