# Phase 8 — Deployment tools, tutorials & programmatic recipes

**Status**: Approved backlog — **implement after Phase 7 Batch 5** (the 62-page error backlog). Not started.
**Created**: 2026-07-05
**Full plan**: `.claude/plans/golden-inventing-wind.md`

## Context & strategy
The `jsondevtools-hosting-action-plan.pdf` proposed a full hosting-affiliate cluster. Decision: the direction is sound but the **affiliate-comparison play is premature** for a ~2-month-old, near-zero-traffic domain whose working thesis (Phase 7) is "rank in verbatim error/reference niches." Phase 8 takes the **low-risk, moat-extending parts** — deployment **tools + tutorials + programmatically-generated recipes** that bridge the existing error cluster — and **defers all affiliate/comparison content** until traffic and authority exist.

Genuine adjacency: *"fixed a Docker/Node/Vite error → now where do I deploy this."* The engine is tool-intent tools (low competition, link-earning) + deploy content that cross-links the error cluster **in both directions**, thickening topical authority — the same logic that made the Phase 7 error cluster compound.

**HARD guardrails for the whole phase:**
- ⛔ **No affiliate links, no AdSense** anywhere in Phase 8.
- **One deployment question = one page** (anti-cannibalization — see Search-intent guardrail).
- **No hardcoded prices** — the cost calculator reads only `data/hosting-pricing.json`.
- Runs **after** Phase 7 Batch 5, not instead of it.

## Canonical supported framework set
Everything references this list; every tool/tutorial/recipe states its applicability:
**Node · Express · React · Vue · Vite · Next.js · Astro · Flask · FastAPI · Go**

---

## A. Deployment tools (client-side, privacy-first)
Reuse the tool-page pattern (`base64.html` / `uuid.html` refs) + `js/utils.js` (`copyToClipboard` / `downloadFile` / `showToast`); Breadcrumb + WebApplication + FAQPage JSON-LD; FAQ↔FAQPage parity; dark-mode-safe CSS; code-highlight on generated output. **Generators must be deterministic** (same inputs → same output).
- [ ] **`.gitignore` + Dockerfile starter generator** (HIGH — fastest; direct bridge from the Docker error pages)
- [ ] **Deployment templates generator** (HIGH — new category; earns "ready-made template" backlinks): `docker-compose.yml`, `.dockerignore`, `Dockerfile`, `nginx.conf`, `systemd` service, GitHub Actions workflow, `render.yaml`, `railway.json`
- [ ] **`.env` validator / `.env.example` generator** (MED — ties to `errors/process-env-undefined.html`; flag format issues + secrets-in-plaintext)
- [ ] **nginx config generator** (MED — reverse proxy / static / SPA-fallback / SSL-redirect)
- [ ] **Hosting cost calculator** (build LAST; future affiliate centrepiece — **ship without affiliate links now**). Every provider = one record in `data/hosting-pricing.json`; **never hardcode a price**; visible **"prices verified YYYY-MM-DD"** stamp; build-time-truth (never carry a stale price forward)
- ~~cron builder~~ — **DROPPED**, `cron.html` already exists (canonical rule)

## B. Deployment tutorials — Tier A (broad, hand-written; bridge the error cluster)
Blog-article pattern (Breadcrumb + Article + FAQPage, VS Code highlighting). **Every tutorial AND recipe must contain:**
1. **Prerequisites** block (e.g. Node 22, Docker installed, Git, GitHub account, domain optional)
2. **Deployment flow diagram** (inline SVG/ASCII: `git push → GitHub → build → deploy → HTTPS → live`)
3. Step body
4. **Deployment Checklist** (✓ build succeeds · env vars set · domain connected · HTTPS enabled · health endpoint works · logs clean · error pages linked) — featured-snippet bait
5. **Common deployment failures** troubleshooting table — error string → link to its fix page (tighter authority than a bare "Related Errors" list)

Tutorials + error-page cross-links:
- [ ] **Deploy a Dockerized app cheaply** ← `docker-exec-format-error`, `docker-port-is-already-allocated`
- [ ] **Deploy a Node.js app** ← `econnreset-socket-hang-up`, `gyp-err-build-error`, `cannot-find-module`, `eaddrinuse-address-already-in-use`, `javascript-heap-out-of-memory`, `process-env-undefined`, `vite-504-outdated-optimize-dep`
- [ ] **Deploy a static site for free** (GitHub Pages / Netlify / Vercel / Cloudflare) — first-hand GitHub-Pages experience; informational, not affiliate
- [ ] **Deploy a Python / Flask / FastAPI app** ← `externally-managed-environment`, `ssl-certificate-verify-failed-python`
- [ ] **Add a custom domain + free SSL** (pairs with the nginx tool)
- [ ] **Where to host a side project in 2026** (free/cheap tiers) — funnels to the cost calculator

## C. Deployment Recipes — programmatic (framework → host, long-tail)
Specific, low-competition combos (each carries the same required sections as tutorials). Starter matrix (~12–15 curated combos, expand as GSC proves demand):
- [ ] Deploy **React → Vercel**
- [ ] Deploy **Next.js → Railway**
- [ ] Deploy **Astro → Cloudflare Pages**
- [ ] Deploy **Express → Fly.io**
- [ ] Deploy **FastAPI → Render**
- [ ] Deploy **Go → Railway**
- [ ] Deploy **Vue → Netlify**
- [ ] Deploy **Vite → Cloudflare Pages**
- [ ] Deploy **Flask → Render**
- [ ] Deploy **Node → Railway**
- [ ] Deploy **Next.js → Vercel**
- [ ] Deploy **React → Netlify**
- [ ] *(expand from GSC demand — do NOT blind-cartesian 10×6)*

### Programmatic generation architecture (HARD)
- **Data:** `data/deploy-recipes.json` — one record per recipe, parameterized values only: `framework`, `host`, `runtime`, `installCommand`, `buildCommand`, `startCommand`, `outputDir`, `envNotes`, `prerequisites[]`, `diagramNodes[]`, `commonFailures[]` (`{errorString, fixPageSlug}`), `verifiedDate`
- **Generator:** `scripts/gen-deploy-recipes.js` emits static HTML between `<!-- GEN -->` sentinels (mirrors `http-status-data.js` / planned LLM-pricing generator). Shared skeleton templated; only recipe-specific values injected.
- **Anti-thin-content guardrail (CRITICAL):** parameterization alone = doorway-page risk (the exact programmatic footprint the site guards against). Each record must carry **genuinely distinct, verified substance** — real per-combo build/output config, real per-combo failure modes, a combo-specific diagram — so no two pages read as boilerplate clones. Curate the matrix; never blind-cartesian all combos.

## D. `/deploy/` pillar hub
Follow the `errors.html` pillar pattern (keyword intro, static crawlable category sections — **Static / Backend / Docker / Domains & SSL** — CollectionPage JSON-LD). Links every tutorial, recipe, and deployment tool. **Every deploy page links back to the hub; the hub links every page** (no orphans).

## E. Cross-linking (the moat mechanism)
"Deploying this?" link from each targeted error page → its matching tutorial/recipe; each tutorial/recipe's troubleshooting table links back to the relevant error pages + tools.

## Search-intent guardrail (HARD, anti-cannibalization)
**One deployment question = one page.** `Deploy React to Railway` ≠ `Deploy React` ≠ `React hosting`. Broad **tutorials** own the concept/host-options intent; **recipes** own the exact `<framework> → <host>` intent. Dedup each target query against existing tutorials, recipes, `errors/`, and `blog/` before building.

## Deferred (NOT in Phase 8 first pass)
Tier-B affiliate comparisons (Vercel vs Netlify; Railway vs Render vs Fly.io; VPS vs PaaS; cheapest Postgres host; GitHub vs Cloudflare Pages); affiliate signup; `rel="sponsored nofollow"` links; disclosure lines; the calculator's affiliate wiring. **Revisit once GSC shows the deploy content ranking + real traffic.**

## Maintenance rules (deploy content goes stale faster than error pages)
**Review every 6 months.** Hosting UI change → update screenshots; pricing change → bump `verifiedDate` in `hosting-pricing.json`; CLI/command change → edit the affected recipe record + regenerate. Because recipe commands live in `deploy-recipes.json`, a CLI change is a one-record edit + regen — not N page edits.

## Registration (existing patterns)
Tools → homepage tool grid (`index.html` `.hp-tool-card`), nav, `sitemap.xml`. Tutorials/recipes → `/deploy/` hub + matching error pages + sitemap. Hub → nav + homepage + sitemap.

## Build order (after Phase 7 Batch 5)
1. **Stage 1 — foundation:** `.gitignore`/Dockerfile generator → 3 Tier-A tutorials (Dockerized app, Node, static) → `/deploy/` hub → cross-link error pages
2. **Stage 2 — recipes engine:** `data/deploy-recipes.json` + `scripts/gen-deploy-recipes.js` → first ~12–15 curated recipes
3. **Stage 3 — depth:** deployment-templates generator + `.env` validator + nginx generator → remaining tutorials (Python, custom domain/SSL, where-to-host)
4. **Stage 4 — calculator:** hosting cost calculator (no affiliate links) off `hosting-pricing.json`
5. **Later (separate go-ahead):** Tier-B comparisons + affiliate layer

## Verification (per page + per batch)
- **Schema:** all JSON-LD parses (Breadcrumb + Article/WebApplication + FAQPage; CollectionPage on hub); FAQ `<details>` == FAQPage count; **no duplicate H1, no duplicate `<title>`**; canonical present + correct
- **Links:** 0 broken internal links; **every cross-link resolves both directions** (error ↔ tutorial/recipe); **hub links every page + every page links hub; no orphans**
- **Intent:** no two pages target the same query
- **Generators:** deterministic; recipe output matches `deploy-recipes.json`; code blocks copy correctly; cost-calculator math checks vs `hosting-pricing.json` + "verified" stamp renders; **no hardcoded prices** anywhere
- **Quality/UX:** Lighthouse pass (perf/SEO/a11y), mobile-friendly, dark mode readable
- **Guardrail:** confirm **no affiliate links and no AdSense** added anywhere in Phase 8
