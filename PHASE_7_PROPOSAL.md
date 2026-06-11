# Phase 7 — Reference-Cluster Expansion + Monetization Experiments

**Status**: Planned (implementation starts 2026-06-10)
**Last Updated**: 2026-06-09

**Goal**: ~**5,000 cumulative GSC impressions during June** by scaling the only niche this low-authority domain can rank in — verbatim developer **error/reference** content — supported by an authority comparison cluster, a links/engagement game, and one AI tool.

**Gating constraint = indexing speed.** New pages take ~3–10 days to go from indexed → first impressions. Pillar 1 ships **first and fast**; later pillars accrue into July. The lever we control is *publish early + internally link + request indexing* — not the ceiling.

> **Honest scope:** 5,000 cumulative is reachable **only if Batch 1 indexes within ~1 week of shipping.** Internal links redistribute the authority we have; they don't create new authority. The error/reference niche is where we've *proven* we can rank (the HTTP-status cluster), so that's the bet.

---

## Strict Priority Order

### 1. Error & Exception Reference Cluster — PRIMARY IMPRESSION ENGINE — `/errors/`

One page per **exact error string** (a real query developers paste verbatim). Each page **must** include:

- [ ] Exact error string in the **H1 and body**
- [ ] **Quick-answer snippet** (40–55 words) directly under the H1
- [ ] **Code example** that produces the error (in the language that throws it)
- [ ] **Cause + fix** explanation
- [ ] **FAQ** section aligned 1:1 with FAQPage schema
- [ ] Schema: **BreadcrumbList + Article + FAQPage + HowTo** (inline literal — the proven `http-status/` pattern)

**Template**: clone `http-status/404.html` (`data-root="../"`, `.quick-answer` box, `.code-block`/`.copy-code-btn`, FAQ `<details>`).
**Hub**: `errors.html` (root) — filterable index mirroring `http-status.html`; register in `js/navbar-component.js` + `json-tools.html` + `sitemap.xml`.

**Priority topics**: JSON parsing → network errors → CORS → Node/Python/JS runtime errors.

#### Batch 1 — NEW `/errors/` pages (no existing post — build these, ship together)
- [ ] `Bad control character in string literal in JSON`
- [ ] `JSONDecodeError: Expecting value: line 1 column 1 (char 0)` (Python)
- [ ] `Expecting property name enclosed in double quotes` (Python)
- [ ] `Extra data: line 1 column N (char N)` (Python)
- [ ] `CORS policy: No 'Access-Control-Allow-Origin' header`
- [ ] `TypeError: Failed to fetch`
- [ ] `net::ERR_CONNECTION_REFUSED`
- [ ] `npm ERR! code ERESOLVE`
- [ ] `Error: Cannot find module`
- [ ] `EADDRINUSE: address already in use`
- **Indexing leads (highest-volume gaps, ship first):** `Failed to fetch`, the CORS string, `JSONDecodeError: Expecting value`.

#### Canonical / no-duplicate rule (HARD) — verified against the actual `/blog/`
Each error intent = **exactly one** page. Do **not** create competing `/errors/` pages for strings already covered.
- [ ] `Unexpected token < in JSON at position 0` (the "API returned HTML" flagship) → **optimize existing** `blog/json-unexpected-token.html` to own this exact string; `blog/json-parse-unexpected-token-o.html` keeps the distinct `o` variant. No new page.
- [ ] `Unexpected end of JSON input` → **existing duplicate to consolidate:** both `blog/json-unexpected-end-input.html` and `blog/fetch-unexpected-end-json-input.html` target this. Pick one canonical, point the other at it (canonical tag). **Fix before adding anything.**
- [ ] Optimize-in-place + link from `errors.html` hub (don't recreate): `blog/json-missing-comma.html`, `blog/json-trailing-comma.html`, `blog/json-single-quotes.html`, `blog/json-comments-not-allowed.html`, `blog/json-nan-infinity.html`, `blog/json-parse-error-handling.html`, `blog/json-parse-returns-string-not-object.html`.
- [ ] Cross-link existing error hubs `blog/common-json-errors.html` + `blog/10-json-errors.html` ↔ new `errors.html`.

> The JSON-parse layer is mostly **optimize + consolidate existing posts**; Batch 1 net-new building is the **non-JSON** strings (CORS, network, Python, Node/npm) with no page yet.

### 2. Technical Comparison Cluster — SECONDARY AUTHORITY ENGINE — `/comparisons/`

**Purpose: topical authority + additional impressions, NOT immediate monetization.** Developer-relevant only.
- [ ] `/comparisons/` hub
- [ ] REST vs GraphQL
- [ ] JSON vs JSONL
- [ ] JWT vs Session
- [ ] CSV vs JSON
- [ ] **Controlled monetization experiment:** one affiliate page — **Postman vs Insomnia vs Bruno** — with `rel="sponsored nofollow"` links + a disclosure line, purely to observe monetization behavior. Avoid SaaS head-to-head beyond long-tail developer intent.
- Each page: Quick-answer + comparison table + FAQ schema; cross-link the cluster + anchor to a relevant tool.
- Existing `/blog/` comparisons (`json-vs-xml`, `yaml-vs-json`, `protobuf-vs-json`) stay put and cross-link into the new hub (no duplicate intent).

### 3. HTTP Status Quiz Game — AUTHORITY + LINKS ENGINE
- [ ] `http-status-quiz.html` + `js/http-status-quiz.js` — interactive client-side quiz ("Guess the status code", streak, shareable score).
- [ ] Link heavily to `/http-status/` and `/errors/`.
- **Primary goal:** backlinks, engagement, internal-link amplification.
- **Launch requires external distribution** (Hacker News / Reddit / Product Hunt maker post — *owner action*; the asset is built share-ready).

### AI Tool for this window — LLM API Cost Calculator
- [ ] `llm-cost-calculator.html` + `js/llm-cost-calculator-tool.js` — tokens (manual entry or paste-to-estimate) × model → cost across providers, side by side. Fully client-side.
- [ ] **Single maintained pricing data file** `js/llm-pricing-data.js` with a visible **"Prices last updated YYYY-MM-DD"** stamp; numbers from each provider's official pricing page only (never cross-checked against other AI tools).
- Target **long-tail** ("gpt-4o api cost per 1k tokens", specific-model cost), not the saturated head term.
- *Caveat: crowded niche (10+ existing tools) + ongoing price-maintenance burden — it's the AI bet for this window, not an impression guarantee.*

---

## Architecture Rules
- **Directory structure:** `/errors/`, `/http-status/`, `/comparisons/` (consistent hub + pages per cluster).
- **HTTP-status pages are the primary crawl entry layer for `/errors/` during the initial indexing phase.** They already earn impressions and are the strongest crawl source, so they must push internal PageRank into `/errors/` and seed its discovery: from relevant `http-status/*` deep pages and the `http-status.html` hub, link to the matching `/errors/` pages (e.g. 502/500/503 → `TypeError: Failed to fetch` / `net::ERR_CONNECTION_REFUSED`; the "JSON on an error response" angle → `Unexpected token < in JSON`). **This linking is part of shipping Batch 1, not an afterthought.**
- Maintain internal linking **between** clusters: errors ↔ errors-hub ↔ http-status ↔ tools; comparisons cross-link; the LLM calculator links the relevant guides.
- **Each intent = exactly one canonical page.** No duplicate-intent pages. No generic SEO filler.

## Indexing Strategy
1. **Publish → internally link → request indexing** (in that order).
2. Submit priority pages first: the `errors.html` hub + flagship error pages.
3. Expect a **3–10 day** delay between indexing and first impressions — plan the calendar around it.

## Build Order (front-loaded for June)
1. **Days 1–3** ⬜ — `/errors/` template + **all Batch 1** + `errors.html` hub + nav/sitemap; fix the `Unexpected end of JSON input` duplicate + optimize the overlapping blog posts; **seed crawl entry: link from `http-status/*` + hub into the new `/errors/` pages**; then **submit sitemap + request indexing** (errors hub + flagship pages first).
2. **Days 4–7** ⬜ — `/comparisons/` hub + 2 comparison pages (REST vs GraphQL, JSON vs JSONL); cross-link existing `/blog/` comparisons into the hub.
3. **Week 2** ⬜ — remaining comparisons + the Postman/Insomnia/Bruno experiment; the LLM Cost Calculator.
4. **Week 3** ⬜ — the quiz game (+ owner distribution); monitor GSC; add more error strings (Java/Go/SQL) if Batch 1 is indexing well.

## Verification (per page, script-based)
1. Exact error string present in H1 + body (grep).
2. All JSON-LD parses; HowTo + FAQPage present; visible `<details>` count **==** FAQPage count; no raw `</script>` / `@context` leak in body.
3. Unique title + meta description ≤160 chars naming the error/topic.
4. No two pages target the same intent (canonical rule); affiliate links carry `rel="sponsored nofollow"`.
5. Every new internal link resolves; cluster hubs link all their pages; `sitemap.xml` `<url>` open/close balanced and includes all new pages with `lastmod` = ship date.
6. LLM calculator: math checks against the pricing data file; "Prices last updated" stamp renders.

## Measurement Framework (track weekly)
- **Indexed page count** — the primary leading indicator (Batch 1 indexing fast = the whole thesis working).
- GSC impressions by query; first appearance of new error strings; crawl-coverage consistency.
- **Success =** rapid indexing of Batch 1 · impressions emerging from new error pages · query coverage expanding **beyond** the HTTP cluster.

## Hard Constraints
- No duplicate-intent pages.
- No generic SEO content.
