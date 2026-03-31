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

```mermaid
graph TB
    subgraph User["👤 User's Machine (Local-First)"]

        subgraph Frontend["apps/web — Next.js 16 Frontend"]
            Dashboard["📊 Dashboard\n(Inbox Stats)"]
            Triage["🏷️ Triage View\n(Card-by-Card)"]
            ChatView["💬 Chat View\n(Read-Only)"]
            Search["🔍 Search\n(FTS5)"]
            Connect["🔗 Connect\n(QR Auth)"]
        end

        subgraph Backend["apps/server — Node.js Backend"]
            API["🌐 Express API\n(REST + WebSocket)"]

            subgraph Bridge["WhatsApp Bridge"]
                Playwright["🎭 Playwright\n(Chromium)"]
                Extractor["📋 DOM Extractor\n(Chats + Messages)"]
            end

            subgraph AI["AI Engine"]
                Categorizer["🏷️ Categorizer\n(Rule-Based)"]
                Summarizer["🤖 Summarizer\n(Claude API)"]
            end

            DB[("💾 SQLite\n+ FTS5 Search\n(Drizzle ORM)")]
        end

        WhatsApp["📱 WhatsApp Web\n(web.whatsapp.com)"]
    end

    Claude["☁️ Claude API\n(Optional)"]

    Dashboard & Triage & ChatView & Search & Connect <-->|"REST + WS\n:3001"| API
    API <--> DB
    API --> Categorizer & Summarizer
    API --> Playwright
    Playwright --> Extractor
    Playwright <-->|"Headless Browser"| WhatsApp
    Summarizer -.->|"Opt-in only"| Claude

    style Frontend fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
    style Backend fill:#f0fdf4,stroke:#16a34a,color:#14532d
    style Bridge fill:#fef9c3,stroke:#ca8a04,color:#713f12
    style AI fill:#fae8ff,stroke:#a855f7,color:#581c87
    style User fill:#fff,stroke:#334155,color:#0f172a
    style Claude fill:#fde68a,stroke:#d97706,color:#78350f
```

### Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web UI (:3000)
    participant S as Server (:3001)
    participant P as Playwright
    participant WA as WhatsApp Web

    U->>W: Open /connect
    W->>S: POST /api/whatsapp/launch
    S->>P: Launch Chromium
    P->>WA: Navigate to web.whatsapp.com
    WA-->>P: Show QR Code
    U->>WA: Scan QR with phone
    WA-->>P: Authenticated
    P->>P: Extract chat list + messages
    P-->>S: Structured data
    S->>S: Store in SQLite + categorize
    S-->>W: Chat data via REST
    W-->>U: Zero Inbox dashboard

    loop Every 30s
        S->>P: Re-sync
        P->>WA: Read DOM
        P-->>S: New messages
        S-->>W: Push via WebSocket
    end
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, Tailwind CSS v4, TypeScript |
| **Backend** | Node.js, Express, WebSocket |
| **Browser Automation** | Playwright (Chromium) |
| **Database** | SQLite + Drizzle ORM + FTS5 |
| **AI** | Claude API (optional) |
| **Monorepo** | Turborepo + pnpm workspaces |

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
