# Draftly

**AI-powered document generator** — describe what you need in plain English and download a professionally formatted Word or PDF document in seconds.

Draftly is a full-stack web app with a Next.js frontend and an Express API. Users sign in with Google, choose a document type, write a brief, and receive an export generated locally via [Ollama](https://ollama.com/). Documents are built in memory and streamed to the browser; nothing is stored on the server.

---

## Features

- **Natural-language input** — write a prompt instead of filling rigid templates
- **Eight document types** — academic, professional, and general-purpose formats
- **Dual export formats** — Microsoft Word (`.docx`) or PDF (`.pdf`)
- **Google OAuth** — secure sign-in with verified ID tokens on every API request
- **Local AI inference** — runs against Ollama on your machine (no cloud LLM API required)
- **Production-minded API** — rate limiting, input validation, CORS allowlist, and hardened prompts

---

## How It Works

```
User (Browser)
    │
    ▼
Next.js Frontend (:3000)
    │  Google OAuth (NextAuth)
    │  Authorization: Bearer <Google ID token>
    ▼
Express API (:5000)
    │  Validate request · Verify auth · Rate limit
    ▼
Ollama (:11434)
    │  Structured document JSON
    ▼
docx / pdfmake
    │
    ▼
File download (in-memory, no persistence)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Node.js, Express 4 |
| Authentication | Google OAuth via Auth.js (NextAuth v5) |
| AI | Ollama (local LLM) |
| Word export | [`docx`](https://www.npmjs.com/package/docx) |
| PDF export | [`pdfmake`](https://www.npmjs.com/package/pdfmake) |
| Validation | Zod |

---

## Prerequisites

Before running Draftly locally, ensure you have:

| Requirement | Notes |
|-------------|-------|
| **Node.js 18+** | Required for frontend and backend |
| **Ollama** | [Install Ollama](https://ollama.com/download) and pull a model (default: `llama3`) |
| **Google OAuth credentials** | Create an OAuth 2.0 Client ID in [Google Cloud Console](https://console.cloud.google.com/) |

### Ollama setup

```bash
# Install Ollama from https://ollama.com/download, then:
ollama pull llama3
ollama serve
```

Ollama listens on `http://127.0.0.1:11434` by default.

### Google OAuth setup

1. Create a project in Google Cloud Console.
2. Configure the **OAuth consent screen**.
3. Create an **OAuth 2.0 Client ID** (Web application).
4. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Copy the **Client ID** and **Client Secret** for your environment files.

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Draftly
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure environment variables

Copy the example files and fill in your values:

```bash
# From the repo root
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

On Windows (PowerShell):

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.local.example frontend\.env.local
```

See [Environment Variables](#environment-variables) below for details.

Generate an Auth.js secret for the frontend:

```bash
npx auth secret
```

### 4. Start the development servers

Use three terminals (Ollama, backend, frontend):

```bash
# Terminal 1 — Ollama (if not already running)
ollama serve

# Terminal 2 — Backend API (port 5000)
cd backend
npm run dev

# Terminal 3 — Frontend (port 3000)
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | API server port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `OLLAMA_MODEL` | No | `llama3` | Ollama model name |
| `OLLAMA_HOST` | No | `http://127.0.0.1:11434` | Ollama API base URL |
| `GOOGLE_CLIENT_ID` | **Yes** | — | Google OAuth client ID (must match frontend) |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed origins |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Global requests per window |
| `GENERATE_RATE_LIMIT_MAX` | No | `10` | Generation requests per user per window |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | **Yes** | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | **Yes** | Google OAuth client secret |
| `AUTH_SECRET` | **Yes** | Auth.js session encryption secret |
| `NEXT_PUBLIC_API_URL` | **Yes** | Backend API URL (e.g. `http://localhost:5000`) |

---

## Document Types

| Category | Type | Key |
|----------|------|-----|
| Academic | Assignment | `assignment` |
| Academic | Lab Experiment Report | `lab_experiment` |
| Academic | Software Requirements Specification | `srs` |
| Academic | Project Report | `project_report` |
| Professional | Resume / CV | `resume` |
| Professional | Cover Letter | `cover_letter` |
| Professional | Meeting Minutes | `meeting_minutes` |
| General | General Purpose Document | `general` |

---

## API Reference

### `GET /api/health`

Health check. No authentication required.

**Response:**

```json
{
  "status": "ok",
  "service": "Draftly API",
  "timestamp": "2026-07-19T00:00:00.000Z",
  "uptime": 42
}
```

### `POST /api/generate`

Generate and download a document. Requires a valid Google ID token.

**Headers:**

```
Authorization: Bearer <google-id-token>
Content-Type: application/json
```

**Request body:**

```json
{
  "prompt": "Write a 2-page SRS for a food delivery mobile app with user auth and order tracking.",
  "docType": "srs",
  "format": "docx"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `prompt` | string | 10–2000 characters |
| `docType` | string | One of the document type keys above |
| `format` | string | `"docx"` or `"pdf"` |

**Response:** Binary file download with appropriate `Content-Type` and `Content-Disposition` headers.

**Rate limit:** 10 requests per minute per authenticated user (configurable).

---

## Project Structure

```
Draftly/
├── backend/                    # Express REST API
│   └── src/
│       ├── config/             # Environment validation (Zod)
│       ├── middleware/         # Auth, validation, error handling
│       ├── prompts/            # Document-type system prompts
│       ├── routes/             # API route handlers
│       ├── services/           # Ollama, DOCX, and PDF generation
│       └── index.js            # Server entry point
│
└── frontend/                   # Next.js application
    ├── app/                    # App Router pages and auth routes
    ├── components/             # UI components
    ├── lib/                    # API client
    ├── types/                  # Shared TypeScript types
    └── auth.ts                 # NextAuth configuration
```

---

## Security

- **Helmet** — HTTP security headers on the API
- **CORS** — explicit origin allowlist
- **Rate limiting** — global (100 req/min) and per-user generation limits (10 req/min)
- **Input validation** — Zod schemas on all API inputs
- **Prompt hardening** — sanitization and injection-resistant system prompts
- **In-memory generation** — no temporary files written to disk
- **Token verification** — Google ID tokens validated on protected routes

---

## Development

```bash
# Backend — watch mode
cd backend && npm run dev

# Frontend — Next.js dev server
cd frontend && npm run dev

# Lint frontend
cd frontend && npm run lint
```

**Default ports**

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend API | 5000 |
| Ollama | 11434 |

---

## Author

**Anish Udasi**  
Final-year Computer Engineering, VESIT Mumbai

---

## License

MIT
