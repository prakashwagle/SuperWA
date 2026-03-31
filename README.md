# SuperWA — Zero Inbox for WhatsApp

A local-first productivity super client for WhatsApp power users. Built on the principle of **zero inbox** — triage, categorize, summarize, snooze, and search your WhatsApp messages like a pro.

## Why

In countries like India, WhatsApp is the primary communication platform — replacing email, CRM, and even identity verification. Yet the official client offers zero productivity tools. SuperWA fills that gap.

## Features

- **Smart Triage** — Auto-categorize chats (personal, business, groups, channels, spam) and process them card-by-card
- **AI Summarization** — One-click summaries of group chats with action item extraction (powered by Claude API)
- **Snooze & Remind** — Temporarily hide conversations and resurface them later
- **Full-Text Search** — Search across all synced messages with SQLite FTS5
- **Zero Inbox View** — Process your inbox to zero, one chat at a time

## Architecture

```
Next.js Frontend  ←→  Node.js Backend  ←→  WhatsApp Web (Playwright)
                            ↕
                     SQLite Database
```

- **Frontend**: Next.js 16 + Tailwind CSS v4 + TypeScript
- **Backend**: Node.js + Express + WebSocket
- **Browser Automation**: Playwright (Chromium)
- **Database**: SQLite with Drizzle ORM + FTS5 full-text search
- **AI**: Claude API (optional, for summarization/categorization)
- **Monorepo**: Turborepo with pnpm workspaces

Everything runs locally on your machine. No messages leave your device (except opt-in Claude API calls for AI features).

## Project Structure

```
SuperWA/
├── apps/
│   ├── web/          # Next.js frontend
│   └── server/       # Node.js backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20.9+
- pnpm 10+

### Install

```bash
git clone https://github.com/prakashwagle/SuperWA.git
cd SuperWA
pnpm install
```

### Run

```bash
# Terminal 1: Start backend
pnpm dev:server

# Terminal 2: Start frontend
pnpm dev:web
```

Then open [http://localhost:3000/connect](http://localhost:3000/connect) to link your WhatsApp account by scanning the QR code.

### AI Features (Optional)

Set your Anthropic API key to enable AI-powered summarization:

```bash
export ANTHROPIC_API_KEY=your-key-here
```

## Disclaimer

This project accesses WhatsApp Web via browser automation, which may violate WhatsApp's Terms of Service. Use at your own risk. This is a personal productivity tool, not intended for commercial use or spam.

## License

MIT
