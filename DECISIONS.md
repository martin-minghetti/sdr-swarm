# Architectural Decisions

Key decisions made during SDR Swarm's design and build, with context and rationale.

---

## 1. Direct SDK over LangGraph / CrewAI

**Decision:** Use the Anthropic SDK directly rather than an agent framework.

**Context:** Several popular frameworks exist for multi-agent systems (LangGraph, CrewAI, AutoGen). The assumption is that more agents = more complexity = need a framework.

**Choice:** Anthropic's own guidance recommends composable patterns for sequential pipelines. SDR Swarm is a 4-agent linear pipeline where each agent takes the previous output as input — there is no branching, no loops, no dynamic routing. A framework would add abstraction without adding capability.

This is also consistent with a prior portfolio project (WhatsApp Receptionist), which uses the same direct-SDK pattern for a different domain. The DECISIONS.md explaining the choice is itself the portfolio signal: it demonstrates understanding of *when* to use frameworks, not just *how*.

**Consequences:** The orchestrator is ~80 lines of plain Python. Debugging is straightforward — no framework magic. The tradeoff is that adding non-linear behavior later (e.g., conditional retry loops) would require more manual wiring.

---

## 2. Sequential pipeline over parallel agents

**Decision:** Run agents in sequence (Researcher → Analyst → Writer → Scorer), not in parallel.

**Context:** Parallel execution sounds faster. The temptation is to run all agents simultaneously to minimize wall-clock time.

**Choice:** Each agent depends on the previous agent's output. The Analyst cannot synthesize what the Researcher hasn't fetched yet. The Writer cannot personalize without the Analyst's ICP assessment. Parallelism at the agent level would require fabricated inputs, which defeats the purpose.

Parallelism *is* used where it makes sense: inside the Researcher agent, `asyncio.gather` fetches from Tavily, the homepage scraper, and Apollo simultaneously. That's where the latency win actually lives.

**Consequences:** Total pipeline latency is the sum of agent latencies (~15–30s end to end). The SSE streaming mitigates perceived wait time. No correctness tradeoffs.

---

## 3. BYOK over hosted keys

**Decision:** Users supply their own API keys (Anthropic, Tavily, Apollo). No hosted keys.

**Context:** The alternative is to manage API keys server-side, absorb costs, and expose the tool as a hosted service.

**Choice:** BYOK keeps the project deployable by anyone without ongoing infrastructure costs. Hiring managers and collaborators can clone the repo, add their keys in Settings, and run a real research immediately. Cost per research is ~$0.08–0.15 — transparent and user-controlled.

Keys are encrypted before storage and never logged.

**Consequences:** Slightly more setup friction (users must obtain their own keys). No rate limit sharing between users. No hosting cost for the maintainer.

---

## 4. Sonnet for agents, Haiku for scorer

**Decision:** Use Claude Sonnet for Researcher, Analyst, and Writer agents; use Claude Haiku for the Scorer.

**Context:** Model selection affects both quality and cost. Using the same model everywhere is simpler but suboptimal.

**Choice:** Research, analysis, and writing require nuanced reasoning — Sonnet is the right tradeoff of quality vs. cost for these tasks. Quality scoring is a simpler classification task (does this output meet the bar? yes/no + confidence). Haiku handles it reliably at roughly 1/10th the cost of Sonnet.

**Consequences:** Cost is reduced by ~15–20% compared to all-Sonnet. If scoring requirements grow in complexity, the model swap is a one-line config change.

---

## 5. SSE over WebSockets

**Decision:** Use Server-Sent Events (SSE) for real-time progress streaming, not WebSockets.

**Context:** WebSockets are the common choice for "real-time" features. SSE is less well-known.

**Choice:** Progress updates in this pipeline are strictly unidirectional — the server pushes agent status updates to the client, and the client never needs to send data back mid-stream. SSE is the correct primitive for unidirectional streams: it needs no library, reconnects automatically, and works over standard HTTP.

WebSockets would add complexity (upgrade handshake, connection state, library dependency) with no benefit for this use case.

**Consequences:** Simpler server implementation. Native browser support with `EventSource`. No bidirectional channel if future requirements need it (at which point upgrading to WebSockets is straightforward).

---

## 6. Supabase over Redis for state

**Decision:** Store research results in Supabase (PostgreSQL + JSONB), not Redis.

**Context:** Research jobs have intermediate state during execution. Redis is often used for job queues and ephemeral state.

**Choice:** Research results are permanent records — they have business value after the pipeline completes (review, comparison, re-use). Redis is designed for sessions and cache, where TTL-based expiry is acceptable. Supabase's JSONB columns allow structured queries over agent outputs (e.g., filter by ICP fit score, search by company name) that Redis cannot provide without additional indexing infrastructure.

**Consequences:** No separate Redis deployment. Research history is queryable and persistent. Slightly higher read latency than Redis for hot-path lookups (not a bottleneck here given the 15–30s pipeline runtime).

---

## 7. BeautifulSoup over Playwright for scraping

**Decision:** Use BeautifulSoup for homepage scraping, not a headless browser like Playwright.

**Context:** Some company websites are SPAs that require JavaScript execution to render meaningful content.

**Choice:** The majority of company homepages serve server-rendered HTML — marketing sites, landing pages, Webflow/Squarespace builds. For these, BeautifulSoup is sufficient and fast. For SPA-heavy sites where scraping returns thin content, Tavily search results (fetched in parallel by the Researcher) serve as the primary data source anyway.

Playwright would add ~200MB of browser dependencies plus a browser subprocess per request, for marginal improvement in a small fraction of cases where Tavily already provides adequate coverage.

**Consequences:** Scraper is lightweight and fast. A small percentage of SPA-heavy sites will yield less content from the scraper, but the Tavily fallback handles this gracefully.
