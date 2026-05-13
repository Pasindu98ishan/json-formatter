# Phase 5 Proposal: Tool Expansion & Marketing Launch

**Version:** 1.7  
**Date:** 2026-05-10  
**Status:** In Progress (Week 3 complete ✅, Week 4 partially complete; UI Session 4 nav redesign planned; long-tail blog pipeline added §6.5)  
**Builds on:** PHASE_4_PROPOSAL.md (Phase 4 complete ✅)

---

## 1. Executive Summary

Phase 4 is complete. The site has 57 pages (18 tool pages + 32 blog posts + static pages), 30 indexed by Google, and is awaiting organic traffic — normal for a site under 90 days old. Google typically starts ranking new sites after the 2–6 month mark.

**Phase 5 goals:**
1. Add 7 new tool pages targeting high-volume, low-competition keywords (Batch 1 + Batch 2)
2. Write 8 companion blog posts to reinforce SEO signal around each new tool
3. Execute the community marketing launch (Product Hunt, HN, Reddit) that has been deferred since Phase 1

**Research basis:** Keyword research and competitive analysis conducted 2026-05-07 identified the following gaps in the developer tools landscape that fit the site's brand and browser-only constraint.

---

## 2. Current Site Inventory

| Category | Count | Examples |
|---|---|---|
| Core JSON tools | 6 | Formatter, Validator, Minifier, Viewer, Beautifier, Diff |
| Converters | 4 | JSON→CSV, CSV→JSON, JSON→YAML, JSON→XML |
| Auth & Encoding | 3 | JWT Decoder, Base64, URL Encoder |
| Utilities | 1 | Timestamp |
| Hub | 1 | json-tools.html |
| Blog posts | 32 | Various |
| Static pages | 4 | About, Contact, Privacy Policy, Terms |
| **Total** | **57** | |

---

## 3. Batch 1 — Quick Wins (High ROI, Minimal New JS)

These 4 tools either reverse an existing converter (reusing the library already loaded) or use browser-native APIs with zero dependencies.

### 3.1 `yaml-to-json.html` — YAML to JSON Converter

- **Target keyword:** "yaml to json converter" — High volume, Medium competition
- **H1:** "YAML to JSON Converter – Convert YAML Online Free"
- **Intent:** DevOps engineers and Kubernetes users who need to paste a YAML config and get JSON back
- **Implementation:** Load `js-yaml` from CDN (same library the `json-to-yaml` converter uses). `jsyaml.load(yamlStr)` returns a JS object → `JSON.stringify(obj, null, 2)`. New file: `js/yaml-to-json-tool.js`
- **Drag-drop:** Accept `.yaml`, `.yml`, `.txt` files
- **Download:** Output as `data.json`
- **GA4 events:** `tool_start`, `convert_yaml_to_json`, `copy_output`, `download_output`
- **Related tools (internal links):** json-to-yaml.html, json-validator.html, formatter.html
- **Sitemap:** priority 0.80, changefreq monthly

### 3.2 `xml-to-json.html` — XML to JSON Converter

- **Target keyword:** "xml to json converter" — Medium volume, Medium competition
- **H1:** "XML to JSON Converter – Convert XML Online Free"
- **Intent:** Backend developers working with legacy APIs or SOAP services who need to transform XML responses to JSON
- **Implementation:** Use browser's built-in `DOMParser` — zero external libraries. Recursive function walks the DOM tree: element with only text → string value; element with attributes → `@attributes` key; repeated sibling elements with same tag → array. New file: `js/xml-to-json-tool.js`
- **Drag-drop:** Accept `.xml`, `.txt` files
- **Download:** Output as `data.json`
- **GA4 events:** `tool_start`, `convert_xml_to_json`, `copy_output`, `download_output`
- **Related tools:** json-to-xml.html, json-validator.html, formatter.html
- **Sitemap:** priority 0.80, changefreq monthly

### 3.3 `uuid.html` — UUID Generator

- **Target keyword:** "uuid generator online" — Medium volume, Medium competition
- **H1:** "UUID Generator Online – Generate UUIDs Instantly"
- **Intent:** Developers who need quick UUID v4 values for database IDs, test data, or API keys
- **Implementation:** Native `crypto.randomUUID()` — no library at all. Features: generate single UUID, bulk generate (1–100), copy each or copy all. New file: `js/uuid-tool.js`
- **GA4 events:** `tool_start`, `generate_uuid`, `copy_output`
- **Related tools:** hash.html (new), timestamp.html, base64.html
- **Sitemap:** priority 0.75, changefreq monthly

### 3.4 `hash.html` — Hash Generator (MD5, SHA-1, SHA-256, SHA-512)

- **Target keyword:** "sha256 generator online", "md5 hash generator" — Medium-High volume, Medium competition
- **H1:** "Hash Generator Online – MD5, SHA-1, SHA-256, SHA-512"
- **Intent:** Developers who need to hash a string for verification, passwords, or checksums
- **Implementation:** WebCrypto API (`crypto.subtle.digest`) for SHA-1/256/512. MD5 requires a small pure-JS implementation (~2kb) since WebCrypto doesn't include it. New file: `js/hash-tool.js`
- **GA4 events:** `tool_start`, `generate_hash`, `copy_output`
- **Related tools:** base64.html, uuid.html, jwt-decoder.html
- **Sitemap:** priority 0.75, changefreq monthly

### 3.5 `px-to-rem.html` — Px ↔ Rem Converter (CSS unit converter)

- **Target keyword:** "px to rem converter", "rem to px", "css unit converter" — High volume, Medium competition
- **H1:** "Px to Rem Converter – Convert CSS Units Online Free"
- **Intent:** Frontend developers and designers who need to convert pixel values to rem for accessible, scalable CSS — common task during design-system migrations
- **Why now:** Broadens the audience beyond JSON-focused users into the wider frontend community. Pure JS, no library, ships in one session.
- **Implementation:** Simple math. Single-value bidirectional converter (live as you type) + bulk CSS converter (regex-replaces every `Npx` / `Nrem` value). Configurable root font size (persisted to localStorage). Reference table that re-renders when base changes. New file: `js/px-to-rem-tool.js`
- **Drag-drop:** Accept `.css`, `.scss`, `.txt` files onto the bulk input
- **GA4 events:** `tool_start`, `convert_px_to_rem`, `convert_rem_to_px`, `copy_output`
- **Related tools:** formatter.html, base64.html, hash.html, url-encoder.html
- **Sitemap:** priority 0.75, changefreq monthly

---

## 4. Batch 2 — Medium Effort (New JS Logic, High Traffic Potential)

These 3 tools require new, non-trivial JavaScript but are still fully browser-based.

### 4.1 `jsonpath.html` — JSONPath Tester

- **Target keyword:** "jsonpath tester online", "jsonpath evaluator" — High volume, Medium competition
- **H1:** "JSONPath Tester Online – Test JSONPath Expressions Instantly"
- **Intent:** API developers who need to write or debug JSONPath expressions to extract values from JSON responses
- **Why now:** RFC 9535 (JSONPath standardization) was published in 2024, driving growing developer interest. Fragmented competitors with poor UX.
- **Implementation:** Load `jsonpath-plus` from CDN (supports RFC 9535 syntax). Dual-pane: JSON input left, expression input + results right. Show matched values as formatted JSON. New file: `js/jsonpath-tool.js`
- **GA4 events:** `tool_start`, `evaluate_jsonpath`, `copy_output`
- **Sitemap:** priority 0.80, changefreq monthly

### 4.2 `json-to-typescript.html` — JSON to TypeScript Interface

- **Target keyword:** "json to typescript interface", "json to typescript converter" — High volume, Medium-High competition
- **H1:** "JSON to TypeScript Interface Generator – Convert JSON Online Free"
- **Intent:** TypeScript developers who paste a JSON API response and need interface/type definitions generated automatically
- **Why now:** TypeScript is used in 70%+ of new JavaScript projects as of 2026. QuickType and transform.tools have this but with heavy UIs. A fast, simple, private alternative has an opening.
- **Implementation:** Custom recursive type inference — no external library. Walk the JSON: `string → string`, `number → number`, `boolean → boolean`, `null → null`, `array → type[]`, nested objects → nested interfaces. Handle optional properties (keys missing from some array items → `key?: type`). New file: `js/json-to-typescript-tool.js`
- **GA4 events:** `tool_start`, `generate_typescript`, `copy_output`
- **Sitemap:** priority 0.80, changefreq monthly

### 4.3 `cron.html` — CRON Expression Generator & Tester

- **Target keyword:** "cron expression generator", "cron parser online", "cron syntax" — High volume, Medium competition
- **H1:** "CRON Expression Generator & Tester Online"
- **Intent:** Backend developers and DevOps engineers who need to write or understand CRON schedule expressions
- **Why now:** crontab.guru is the dominant tool but has minimal UI. Gap for a tool that explains each field + shows next N run times.
- **Implementation:** Pure JS. Visual builder: 5 fields (minute, hour, day, month, weekday) with dropdowns + free-text input. Expression parser: explain each field in plain English. Next-runs calculator: show next 5 scheduled datetimes using date math. New file: `js/cron-tool.js`
- **GA4 events:** `tool_start`, `parse_cron`, `copy_output`
- **Sitemap:** priority 0.75, changefreq monthly

---

## 5. Batch 3 — Deferred

| Tool | Reason deferred |
|---|---|
| JSON Schema Validator | AJV library is 60kb+ — wait until Batch 1+2 ship and assess page weight |
| Regex Tester | regex101.com dominates with 10M+ monthly users; too competitive |
| SQL Formatter | Off-brand for a JSON-focused site; medium demand |

---

## 6. Blog Post Plan (8 Posts)

Each new tool needs a companion blog post to reinforce the SEO signal and create internal links to the tool.

| Post file | Title | Pairs with | Priority |
|---|---|---|---|
| `blog/yaml-to-json.html` | "How to Convert YAML to JSON Online" | yaml-to-json.html | P1 |
| `blog/xml-to-json.html` | "How to Convert XML to JSON Online" | xml-to-json.html | P1 |
| `blog/yaml-vs-json.html` | "YAML vs JSON: When to Use Each Format" | yaml-to-json + json-to-yaml | P1 (standalone, high traffic) |
| `blog/uuid-guide.html` | "What Is a UUID and How to Generate One" | uuid.html | P2 |
| `blog/hash-guide.html` | "MD5 vs SHA-256: Which Hash Should You Use?" | hash.html | P2 |
| `blog/jsonpath-guide.html` | "JSONPath Complete Guide – Query JSON Like XPath" | jsonpath.html | P2 |
| `blog/json-to-typescript.html` | "Generate TypeScript Interfaces from JSON Automatically" | json-to-typescript.html | P2 |
| `blog/understanding-cron.html` | "Understanding CRON Expressions with Examples" | cron.html | P3 |
| `blog/px-to-rem-guide.html` | "Px to Rem in CSS: Complete Conversion Guide" | px-to-rem.html | P2 |

---

## 6.5 Long-Tail Blog Post Pipeline (SEO-Driven)

**Current GSC signal (as of 2026-05-10):** 678 impressions, 8 organic clicks. CTR ~1.2% indicates most placements are page 2/3. The lever to lift CTR is to push more pages onto page 1 — and the fastest route is more long-tail content where competition is thin.

**Strategic note:**

> Long-tail blog posts are the fastest path to page 1 right now — not the tool pages. The tool pages compete with established sites (jsonformatter.org, jsonlint.com, freeformatter.com) that have a decade-plus head start and thousands of backlinks. Error-specific and problem-fix blog posts have much less competition, target high-intent debugging searches, and Google is already showing interest in this site for those queries (678 impressions, 8 clicks confirmed in GSC on 2026-05-10). Going forward, blog content velocity is the primary growth lever.

**Existing coverage (13 posts, no need to rewrite):** `json-trailing-comma`, `json-unexpected-token`, `json-unexpected-end-input`, `json-missing-comma`, `json-single-quotes`, `json-comments-not-allowed`, `json-undefined-value`, `json-nan-infinity`, `json-circular-reference`, `json-object-keys-must-be-strings`, `json-parse-error-handling`, `common-json-errors`, `10-json-errors`.

**Coverage gaps to fill:** scenario-specific errors (fetch, frameworks), language-specific debugging, behavioural gotchas (silent drops, type coercion), encoding edge cases.

**Recommended pipeline (10 posts):**

| Post file | Working title | Search intent | Pairs with | Priority |
|---|---|---|---|---|
| `blog/fetch-unexpected-end-json-input.html` | "Unexpected end of JSON input in fetch() — Causes and Fixes" | Debugging fetch().json() failures | formatter.html, json-validator.html | P1 |
| `blog/json-parse-unexpected-token-o.html` | "JSON.parse 'Unexpected token o in JSON at position 1' — Why and Fix" | Beginner passing an object to JSON.parse | formatter.html | P1 |
| `blog/api-returning-html-instead-of-json.html` | "Why is my API Returning HTML Instead of JSON?" | API debugging — login redirects, wrong endpoint, error pages | json-validator.html, jwt-decoder.html | P1 |
| `blog/json-parse-returns-string-not-object.html` | "JSON.parse Returns a String Instead of an Object — Common Causes" | Double-encoded JSON gotcha | formatter.html | P1 |
| `blog/json-maximum-call-stack-exceeded.html` | "Fix: 'Maximum call stack size exceeded' in JSON.parse / JSON.stringify" | Deep nesting / circular reference surface error | json-circular-reference.html (link) | P2 |
| `blog/json-stringify-drops-functions.html` | "Why JSON.stringify Drops Functions, undefined, and Symbols" | Common silent-drop gotcha | formatter.html | P2 |
| `blog/json-bom-error.html` | "JSON BOM Error: Fix Byte Order Mark / Encoding Issues" | UTF-8 BOM + JSON.parse incompatibility | json-validator.html | P2 |
| `blog/json-date-format-best-practices.html` | "JSON Date Format: ISO 8601 vs Unix Timestamp Best Practices" | API design decision content | timestamp.html | P2 |
| `blog/validate-json-python.html` | "How to Validate JSON in Python — json.loads Errors Explained" | Python-specific debugging | json-validator.html | P2 |
| `blog/json-parse-vs-eval.html` | "JSON.parse vs eval() — Why eval is Dangerous" | Security / educational | formatter.html | P3 | 
blog/url-encoding-guide.html - "URL Encoding Explained — Spaces, Special Characters & When to Encode

**Pick rationale:** All 10 are specific Google searches developers actually type (not generic "what is JSON" content). None duplicate the existing 13 error posts. Each has a natural CTA to one of the existing tool pages, which feeds tool-page traffic via internal linking. P1 = ship first (4 highest-volume / most-common debugging searches), P2 = fill in next, P3 = optional / lower-volume.

**Cadence target:** 1 P1 post per week interleaved with the existing tool roadmap. Four P1s over four weeks puts ~10 new pages into Google's index alongside `cron.html`, materially closing the gap to the 50+ indexed-pages month-2 target in §12.

---

## 7. Marketing Launch Actions (User-Side — Cannot Be Automated)

These community distribution tasks have been deferred since Phase 1 and should be executed now while new pages are getting indexed.

### This Week
1. **Product Hunt** — Submit at producthunt.com. Best time: Tuesday–Thursday morning PST. Description: *"Free browser-based developer tools — JSON formatter, converter, JWT decoder, and 18+ more. No signup, your data never leaves your browser."*
2. **Hacker News "Show HN"** — Post in the evening (US time). Title: *"Show HN: JSON Dev Tools – 18 free developer utilities that run entirely in your browser"*. Keep description to 2–3 lines.

### Within 2 Weeks
3. **Reddit** — Post in r/webdev, r/learnprogramming, r/node. Share a *specific new tool* (not the homepage) — gets more engagement. E.g. *"Built a free JSONPath tester — test RFC 9535 expressions right in your browser."*
4. **Dev.to** — Cross-post 2–3 of the blog articles as Dev.to articles (add canonical back to the site). Dev.to articles index fast and drive referral traffic.
5. **Awesome lists (GitHub)** — Open a PR to add the site to `awesome-json` and any `awesome-developer-tools` lists you find. These give high-quality backlinks.

---

## 8. Execution Order

```
Week 1:  ✅ yaml-to-json.html + xml-to-json.html (tools)
         ✅ blog/yaml-to-json.html + blog/xml-to-json.html + blog/yaml-vs-json.html (posts)
         ✅ Update: sitemap.xml, json-tools.html hub, nav "More ▾" on all existing pages
         ✅ blog/index.html updated with 3 new post cards
         ✅ Bug fix: dark mode flash on page navigation (62 HTML files patched)

Week 2:  ✅ uuid.html + hash.html (tools)
         ✅ blog/uuid-guide.html + blog/hash-guide.html (companion posts)
         ✅ blog/uuid-v4-vs-v7.html + blog/sha256-vs-sha512.html (extra SEO posts)
         ✅ sitemap.xml, json-tools.html hub, nav dropdown on all pages updated
         ✅ blog/index.html updated with 4 new post cards
         ✅ UUID Generator UI redesigned (version badge, qty input, primary Generate btn)
         [ ] Marketing: Product Hunt + Hacker News launch (user-action pending)

Week 3:  ✅ jsonpath.html + json-to-typescript.html (tools)
         ✅ blog/jsonpath-guide.html + blog/json-to-typescript.html (companion posts)
         ✅ sitemap.xml, json-tools.html hub, nav dropdown on all pages updated
         ✅ blog/index.html updated with 2 new post cards
         ✅ Nav gap fix: 6 pages (json-diff, yaml-to-json, xml-to-json + 3 blog pages) patched with full 13-tool dropdown

Week 4:  ✅ px-to-rem.html + js/px-to-rem-tool.js (CSS unit converter — quick-win bonus)
         ✅ blog/px-to-rem-guide.html (companion post)
         ✅ Sitemap + json-tools.html hub + blog/index.html + nav dropdown rolled out across all 72 pages
         ✅ cron.html + js/cron-tool.js (CRON expression generator & tester)
         ✅ blog/understanding-cron.html (companion post)
         ✅ Sitemap + json-tools.html hub + blog/index.html + nav dropdown rolled out across all 77 pages
         ✅ Upload JSON button added to formatter.html + json-validator.html (FileReader, matches json-to-csv pattern)
         [ ] Marketing: Reddit posts (one per new tool, spread over the week)
```

---

## 9. Checklist for Every New Tool Page

- `<head>`: charset, viewport, description, keywords, canonical, og:title/description/url, twitter:card, title, CSS links, GA tag, AdSense placeholder, BreadcrumbList + WebApplication JSON-LD
- Nav: same hamburger nav; add tool to "More ▾" dropdown on **all existing pages** (batch update with PowerShell)
- `<header class="header">`: H1 + short tagline
- `<main>`: tool UI + 3+ explanatory content sections + FAQ (minimum 3 questions)
- Footer: standard
- Scripts: `js/nav.js`, `js/dark-mode.js`, new tool JS file
- `sitemap.xml`: new entry, priority per table below, lastmod `2026-05-07`, changefreq monthly
- `json-tools.html`: add card to correct category section
- `blog/index.html`: if a companion blog post was written, add a card

---

## 10. Sitemap Priorities for New Pages

| File | Priority |
|---|---|
| `yaml-to-json.html` | 0.80 |
| `xml-to-json.html` | 0.80 |
| `jsonpath.html` | 0.80 |
| `json-to-typescript.html` | 0.80 |
| `uuid.html` | 0.75 |
| `hash.html` | 0.75 |
| `cron.html` | 0.75 |
| `px-to-rem.html` | 0.75 |
| Blog posts | 0.60 (standard) |

---

## 11. Full File Checklist

| File | Action | Priority | Status |
|---|---|---|---|
| `yaml-to-json.html` | New tool page | P1 | ✅ Done |
| `js/yaml-to-json-tool.js` | YAML→JSON JS (uses js-yaml CDN) | P1 | ✅ Done |
| `xml-to-json.html` | New tool page | P1 | ✅ Done |
| `js/xml-to-json-tool.js` | XML→JSON JS (uses DOMParser) | P1 | ✅ Done |
| `blog/yaml-to-json.html` | Companion blog post | P1 | ✅ Done |
| `blog/xml-to-json.html` | Companion blog post | P1 | ✅ Done |
| `blog/yaml-vs-json.html` | Standalone post (high traffic keyword) | P1 | ✅ Done |
| All nav dropdowns (root + blog) | Add YAML→JSON + XML→JSON links | P1 | ✅ Done |
| `sitemap.xml` | Add all new tool + blog URLs | P1 | ✅ Done |
| `json-tools.html` | Add cards for new tools in correct sections | P1 | ✅ Done |
| `blog/index.html` | Add cards for new blog posts | P1 | ✅ Done |
| All 62 HTML pages | Bug fix: dark mode flash on navigation | Bug | ✅ Done |
| `uuid.html` | New tool page | P1 | ✅ Done |
| `js/uuid-tool.js` | UUID generator JS (crypto.randomUUID) | P1 | ✅ Done |
| `hash.html` | New tool page | P1 | ✅ Done |
| `js/hash-tool.js` | Hash generator JS (WebCrypto + MD5) | P1 | ✅ Done |
| `blog/uuid-guide.html` | Companion blog post | P2 | ✅ Done |
| `blog/hash-guide.html` | Companion blog post | P2 | ✅ Done |
| `blog/uuid-v4-vs-v7.html` | Extra SEO post: UUID v4 vs v7 for DB primary keys | P2 | ✅ Done |
| `blog/sha256-vs-sha512.html` | Extra SEO post: SHA-256 vs SHA-512 performance & security | P2 | ✅ Done |
| All nav dropdowns (root + blog) | Add UUID Generator + Hash Generator links | P1 | ✅ Done |
| `jsonpath.html` | New tool page | P2 | ✅ Done |
| `js/jsonpath-tool.js` | JSONPath evaluator JS (jsonpath-plus CDN) | P2 | ✅ Done |
| `json-to-typescript.html` | New tool page | P2 | ✅ Done |
| `js/json-to-typescript-tool.js` | TypeScript interface generator JS | P2 | ✅ Done |
| `blog/jsonpath-guide.html` | Companion blog post | P2 | ✅ Done |
| `blog/json-to-typescript.html` | Companion blog post | P2 | ✅ Done |
| `cron.html` | New tool page | P3 | ✅ Done |
| `js/cron-tool.js` | CRON parser + next-runs calculator JS | P3 | ✅ Done |
| `blog/understanding-cron.html` | Companion blog post | P3 | ✅ Done |
| `px-to-rem.html` | New tool page (CSS unit converter) | P2 | ✅ Done |
| `js/px-to-rem-tool.js` | Px↔Rem converter + bulk CSS regex transform | P2 | ✅ Done |
| `blog/px-to-rem-guide.html` | Companion blog post | P2 | ✅ Done |
| All nav dropdowns (root + blog) | Add Px↔Rem link to dropdown on every page | P2 | ✅ Done (72 files patched via PowerShell batch) |
| `sitemap.xml` | Add `px-to-rem.html` + `blog/px-to-rem-guide.html` URLs | P2 | ✅ Done |
| `json-tools.html` | Add Px↔Rem card to Utilities section | P2 | ✅ Done |
| `blog/index.html` | Add Px to Rem post card (newest, top of grid) | P2 | ✅ Done |
| `index.html` | Categorized nav redesign — homepage pilot (Session 4) | P3 | [ ] Pending |
| `css/styles.css` | `.nav-cta` button + `.nav-dropdown.open` rule (Session 4) | P3 | [ ] Pending |
| `js/nav.js` | Tap-to-toggle for dropdown buttons (Session 4) | P3 | [ ] Pending |
| All 75 other pages | Sitewide rollout of categorized nav (Session 4 stretch) | P3 | [ ] Deferred until pilot accepted |

---

## 12. 90-Day Traffic Targets

| KPI | Current | Month 1 Target | Month 2 Target | Month 3 Target |
|---|---|---|---|---|
| Monthly sessions | ~0 (pre-ranking) | 500–1,000 | 2,000–5,000 | 5,000–10,000 |
| Indexed pages | 30 | 40+ | 50+ | 64+ |
| Tools live | 18 | 22 | 24 | 25 |
| Blog posts live | 32 | 35 | 38 | 40 |
| Referring domains | ~0 | 5+ | 15+ | 30+ |

---

## 13. UI Improvement Plan (from Quality Report — May 7, 2026)

Based on the Website Quality Report. Skipped items: visual design system, JSON-LD (already done), global search, GitHub/trust signals, logo/OG images.

### Session 1 — Quick Wins (~1 hour)

| Item | File | What to do |
|---|---|---|
| A. Persist formatter input | `js/formatter.js` | On `input` event (debounced 500ms): `localStorage.setItem('formatterInput', value)`. On load: restore from localStorage. |
| B. Ctrl/Cmd+Enter shortcut | `js/formatter.js` | `keydown` listener: if `(ctrlKey \|\| metaKey) && key==='Enter'` → trigger Format. Add hint text near button. Extend to validator + minifier. |
<!-- | C. Homepage hero CTA | `index.html` | Add a prominent `<a href="formatter.html" class="btn btn-primary">Open JSON Formatter →</a>` in the `<header>` below the tagline. | -->
| D. Button + Toast polish ⚡ Very High | `css/styles.css`, all tool pages | Polish button styles (hover states, active press effect). Replace alert/static copy confirmation with a small "Copied!" toast div that fades out after 1.5s. |
| E. Better spacing & card padding | `css/styles.css` | Standardize padding/margins across all tool pages — consistent card padding, section gaps, and button-group spacing. |

### Session 2 — CodeMirror 6 Syntax Highlighting (~3 hours)

Transforms the formatter from plain `<textarea>` to professional editor.

- **Library:** CodeMirror 6 via CDN (not Monaco — Monaco is 2MB+, CodeMirror 6 is ~200kb)
- **Features:** JSON syntax highlighting, line numbers, inline error markers replacing the separate error div, read-only output pane
- **Files:** `formatter.html`, `js/formatter.js`
- **Scope:** Formatter first, then validator as follow-up

### Session 3 — Accessibility (~2 hours)

- Verify colour contrast WCAG 2.1 AA (4.5:1) in light and dark mode
- Add `aria-label` to icon-only buttons (Copy, Download)
- Fix keyboard nav on "More ▾" dropdown (Tab + Enter + Escape)
- Run Lighthouse audit in Chrome DevTools — target score ≥ 90

### Session 4 — Categorized Nav Redesign (~2 hours)

Replace the single overgrown `More ▾` dropdown (now 14 items) with grouped category dropdowns, plus a JSON Formatter primary CTA button. Cleaner mental model and ready to scale as new tools land (cron, color, bytes, regex).

**Proposed structure:**

```
[Logo]   JSON Formatter   JSON Tools ▾   Converters ▾   Encoders ▾   Generators ▾   [🌙 Dark]
```

**Tool categorisation** (all 19 tools mapped):

| Category | Tools |
|---|---|
| **Formatter** (CTA button) | `formatter.html` |
| **JSON ▾** (6) | JSON Validator, JSON Minifier, JSON Diff, JSON Viewer, JSON Beautifier, JSONPath Tester |
| **Converters ▾** (9) | JSON↔CSV, JSON↔YAML, JSON↔XML, JSON→TypeScript, Px↔Rem, Timestamp |
| **Encoders ▾** (3) | Base64, URL Encoder, JWT Decoder |
| **Generators ▾** (2) | UUID Generator, Hash Generator |

**Files to change (homepage pilot):**

- `index.html` — replace `<ul class="nav-links">…</ul>` with new structure
- `css/styles.css` — add `.nav-cta` button styling, `.nav-dropdown.open .dropdown-menu { display: block }`, tighten flex `gap`
- `js/nav.js` — add tap-to-toggle for `.dropdown-toggle` (CSS `:hover`/`:focus-within` are unreliable on touch)

**Approach:** Homepage pilot first (`index.html` only). If it lands well, batch-roll the new nav across the other 75 pages via PowerShell `.Replace()` — same pattern as the px-to-rem rollout. The sitewide rollout has two extra wrinkles vs px-to-rem: per-page active-link injection and the root/blog path-prefix variants (`formatter.html` vs `../formatter.html`).

**Plan reference:** Detailed design saved at `~/.claude/plans/i-am-going-to-parallel-fountain.md`.

### Status

| Session | Items | Status |
|---|---|---|
| Session 1 | A (localStorage) + B (Ctrl+Enter) + D (toast) | ✅ Done |
| Session 1 | C (homepage hero CTA) | ⏭ Skipped |
| Session 1 | E (spacing/card padding) | [ ] Pending |
| Session 2 | CodeMirror 6 syntax highlighting | ✅ Done |
| Session 3 | Accessibility audit + fixes | [ ] Pending |
| Session 4 | Categorized nav redesign (homepage pilot) | [ ] Pending — plan approved, implementation deferred |
| Session 4 | Categorized nav — sitewide rollout to 75 other pages | [ ] Deferred (after pilot acceptance) |

---

**Document Version:** 1.6  
**Last Updated:** 2026-05-10  
**Status:** Week 3 complete ✅ — Week 4 in progress (`px-to-rem.html` fully launched: tool + blog + sitemap + hub + nav rollout done; `cron.html` still pending). UI Session 4 (categorized nav redesign) planned, implementation deferred.  
**Next Step:** `cron.html` + `blog/understanding-cron.html`, then UI Session 4 implementation, then Product Hunt / Hacker News launch (user-action)
