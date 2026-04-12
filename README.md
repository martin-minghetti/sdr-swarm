# SDR Swarm

SDR Swarm helps B2B teams research companies and draft personalized outreach without manual prospecting.

![Home — Light](docs/screenshots/01-home-light.png)

---

## How it works

SDR Swarm runs a 4-agent sequential pipeline triggered by a single company URL or domain. Each agent builds on the previous output, and the entire process streams real-time progress to the dashboard via Server-Sent Events.

```mermaid
graph LR
    A[User Input] --> B[Orchestrator]
    B --> C[🔍 Researcher]
    C --> D[📊 Analyst]
    D --> E[✍️ Writer]
    E --> F[✅ Scorer]
    F --> G[Dashboard]
```

| Agent | Role |
|-------|------|
| **Researcher** | Fetches company data from Tavily search, homepage scraping, and Apollo enrichment in parallel |
| **Analyst** | Synthesizes raw data into structured company intelligence (ICP fit, pain points, tech stack) |
| **Writer** | Drafts a personalized cold email and LinkedIn message based on the analysis |
| **Scorer** | Evaluates output quality and flags low-confidence results for human review |

**Cost per research: ~$0.08–0.15** (Sonnet for research/analysis/writing, Haiku for scoring)

---

## Screenshots

### Pipeline Progress
![Pipeline Running](docs/screenshots/05-pipeline-running.png)

### Company Profile
![Company Profile](docs/screenshots/06-results-company-profile.png)

### Opportunity Analysis
![Opportunity Analysis](docs/screenshots/07-results-opportunity.png)

### Outreach Draft
![Outreach Draft](docs/screenshots/08-results-outreach.png)

### Quality Report
![Quality Report](docs/screenshots/09-results-quality.png)

### Dark Mode
![Home Dark](docs/screenshots/11-home-dark.png)
![Outreach Dark](docs/screenshots/13-outreach-dark.png)

---

## BYOK — Bring Your Own Keys

SDR Swarm uses your own API keys, stored encrypted in your Supabase instance. No keys are ever sent to any server other than the provider APIs directly. You control your costs and rate limits.

Required keys:
- **Anthropic** — Claude Sonnet + Haiku for agents
- **Tavily** — web search for company research
- **Apollo** *(optional)* — contact and company enrichment

Keys are entered in the Settings panel and stored encrypted in your database.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.14) |
| Agents | Anthropic Claude via direct SDK |
| Search | Tavily API |
| Enrichment | Apollo API |
| Scraping | BeautifulSoup |
| Database | Supabase (PostgreSQL + JSONB) |
| Frontend | Next.js 16 (App Router) + Tailwind CSS 4 |
| UI | Neomorphic design with dark mode |
| Streaming | Server-Sent Events (SSE) |
| CI | GitHub Actions |
| Deployment | Railway (backend) + Vercel (frontend) |

---

## Quick start

### 1. Clone the repo

```bash
git clone https://github.com/martin-minghetti/sdr-swarm.git
cd sdr-swarm
```

### 2. Create a Supabase project and run the migration

1. Create a new project at [supabase.com](https://supabase.com)
2. Open the SQL editor and run the contents of `backend/migrations/001_initial_schema.sql`

### 3. Set up the backend

```bash
cd backend
cp .env.example .env
# Fill in your SUPABASE_URL, SUPABASE_KEY, and ENCRYPTION_KEY
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

### 4. Set up the frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

### 5. Add your API keys and run a research

1. Open `http://localhost:3000`
2. Go to **Settings** and enter your Anthropic and Tavily API keys
3. Click **New Research**, enter a company URL
4. Watch the 4-agent pipeline run in real time

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/research` | Start a new research job |
| `GET` | `/api/research/{id}/stream` | SSE stream for real-time progress |
| `GET` | `/api/research/{id}` | Fetch completed research result |
| `GET` | `/api/history` | List recent research jobs |
| `POST` | `/api/settings` | Save encrypted API keys |
| `GET` | `/api/settings` | Get masked API keys |
| `POST` | `/api/settings/validate` | Validate stored keys |
| `GET` | `/health` | Health check |

---

## Project structure

```
sdr-swarm/
├── backend/
│   ├── agents/           # Researcher, Analyst, Writer, Scorer
│   ├── services/         # Tavily, Apollo, scraper integrations
│   ├── models/           # Pydantic request/response models
│   ├── migrations/       # Supabase SQL migrations
│   ├── tests/            # 65 tests (pytest)
│   ├── orchestrator.py   # Pipeline coordinator
│   ├── main.py           # FastAPI app + SSE endpoints
│   └── config.py         # Settings and env vars
├── frontend/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # UI components (progress, results, settings)
│   └── lib/              # API client, SSE utilities
├── docs/
│   └── screenshots/      # UI screenshots
├── .github/
│   └── workflows/
│       └── test.yml      # CI: lint, type-check, test
├── DECISIONS.md          # Key architectural decisions with rationale
└── LICENSE
```

---

## Built with

- [Anthropic Claude](https://anthropic.com) — agent intelligence
- [Tavily](https://tavily.com) — real-time web search
- [Apollo.io](https://apollo.io) — B2B enrichment
- [Supabase](https://supabase.com) — database and auth
- [FastAPI](https://fastapi.tiangolo.com) — backend framework
- [Next.js](https://nextjs.org) — frontend framework

---

## License

MIT — see [LICENSE](LICENSE)
