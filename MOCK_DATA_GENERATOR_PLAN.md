# Mock Data Generator — Implementation Plan

**Status**: ✅ **v1 SHIPPED + QA-passed** (built, redesigned, two QA rounds fixed) — 2026-06-20
**Created**: 2026-06-18 · **Updated**: 2026-06-20
**Owner**: Pasindu Ishan
**Slug**: `mock-data-generator.html`

> A privacy-first, **100% client-side** JSON mock-data generator. Build data from a **field picker**, **infer shape from a pasted sample and generate more like it** (the main feature), or a **minimal JSON Schema** — with realistic *coherent* values, a **seed** for reproducibility, and JSON/NDJSON/CSV export. Positioning: *"your data never leaves your browser, works offline, no row cap."*

---

## ✅ What was built (implementation log)

**v1-core engine + tool — shipped & verified.**
- **`js/mock-data-faker.js`** — zero-dependency deterministic engine: mulberry32 PRNG (xmur3-seeded), `RowContext`, declarative `CoherenceRules[]` with Kahn topo-sort + cycle detection, ~40 context-aware generators, bundled en-US data (coherent location tuples), dual-export. Determinism verified (same seed → byte-identical across runs/machines/chunk sizes, incl. equal-N).
- **`mock-data-generator.html` + `js/mock-data-generator-tool.js`** — three modes (field picker / sample JSON / JSON Schema) all compile to `MockSchema`; live preview vs. full chunked generation (soft cap 100k notice, hard cap 1M, progress bar); JSON / NDJSON / CSV (dot-notation flatten + nesting warning); seed; `?mode=` deep-linking; Breadcrumb + WebApplication + FAQPage schema (no HowTo).
- **Sample inference** — value-pattern beats key-name; order-independent tie-break → generic `string`; low-cardinality strings → enum; numeric range captured from sample.

**Wave-1 SEO** — `generate-json-from-example.html` moat landing (CTA deep-links `?mode=sample`); nav entry, `json-tools.html` card, sitemap, cross-links from schema/TS pages.

**UX redesign ("schema-as-code")** — replaced the card stack with a JSON-like code block (`root = { … }`, left rail), **category-colored type badges**, inline `name : Type ▾` selectors, searchable type picker (ranked search, ⭐ Common + groups, full a11y: focus trap/return, ↑/↓/Enter/Esc, scroll lock), **drag-to-reorder** (+ accessible ▲/▼), **syntax-highlighted dark console** (escape-then-tint, JSON-only under 50k), preview/generated pip states. Plus: **Reset / Clear all**, **per-field options toggle** (collapsed by default → compact rows), **localStorage persistence** (versioned `{v:1,fields}`), **sticky output toolbar** (offset below the 70px site navbar), tightened page chrome.

**QA — two rounds, all fixed.**
- *Static review (25 findings):* XSS-escaped seed, chunk try/catch, clipboard `.catch`, array count clamp, ipv6 zero-pad, snake_case `created_at` coherence, expanded data tables, dropped `title→jobTitle`, status→enum inference, focus trap, tabpanel `tabindex`, status timestamp+size, modal scroll-lock, file drag-drop, empty-output guards, versioned storage, etc. (BUG-22 was a false positive — kept, documented.)
- *Live browser review (8 findings):* mobile horizontal overflow (grid items `min-width:0`), array Min/Max cross-validation, mode-aware preview errors, `allOf/anyOf/oneOf` clear error, enum demo example, numeric range, single-word array items, schema nullable semantics.
- Engine smoke-tested in Node; full flows verified with Playwright; **0 console errors**.

**Deferred (unchanged from plan):** Wave-2 SEO assets (hubs, mockaroo/faker.js landings, example pages) and the entire v2 roadmap below.

---

## ⚠️ Do FIRST (before writing any code)
- [x] **Finalize the `MockSchema` shape for nested objects + arrays on paper.** All three entry points compile to it, and the engine, formatters, and coherence walk all depend on it. This is the only decision here that forces a real rewrite if it's wrong. Lock it before step 1. — *Locked: `[{ name, generator, options, nullChance }]`; `object`→`options.fields`, `array`→`options.item` + `options.count`.*

---

## Why (demand validation, condensed)
- The need is real and recurring but met mostly by **code libraries** (faker, json-schema-faker) and **server tools** (Mockaroo — 1,000-row free cap, schema leaves your machine). Gap = a polished no-code, client-side UI.
- Loudest pains: Mockaroo's row cap/paywall, server-side privacy risk, faker.js dependency fatigue (Marak incident), JSONPlaceholder/DummyJSON being fixed/non-customizable.
- Strongest differentiation = **"paste sample JSON → generate more like it"** (least served). #1 quality complaint about existing tools = **incoherent data** (name ≠ email; city/state/zip mismatched) → our coherence system is the wedge.

---

## v1 scope (focused — build this)
- [x] Field picker
- [x] **Sample JSON → generator (MAIN FEATURE)**
- [x] Seed + deterministic PRNG
- [x] Coherence system (declarative rules — see Engine)
- [x] Exports: **JSON array + NDJSON + CSV**
- [x] **Minimal JSON Schema subset** (`type, properties, required, items, enum, format, min/max`) — no OpenAPI, no `$ref`
- [x] **SEO asset layer (WAVE 1 only)**: tool page + the one differentiated landing page. Remaining SEO assets are a fast-follow wave (see SEO section).

Everything else → **v2 roadmap** at the bottom.

---

## Reuse (do NOT rewrite)
- `js/utils.js`: `downloadFile(content,filename,mime)`, `copyToClipboard(text)`, `showToast(msg)`, `jsonToCSV(jsonString,includeHeader)`, `initDragDrop(id,onLoad,accepts)`, `getJSONSize(str)`, `saveToLocalStorage/getFromLocalStorage`, `debounce`.
- **Shape inference**: `inferSchema()`/`inferType()` + format regexes — `js/json-schema-generator-tool.js`; `mergeSchemas()` — `js/json-schema-multi-generator-tool.js`.
- `toPascalCase()`, `singularize()` — `js/json-to-typescript-tool.js`.
- `crypto.randomUUID()` (non-seeded path only) — `js/uuid-tool.js`.
- Dual-export data-file pattern — `js/http-status-data.js` (~lines 191-197).
- Page scaffold / script order / schema blocks: clone `chmod.html`.

---

## Engine architecture (context-aware, not isolated randomness)
Generators are **context-aware functions reading/writing a per-row `RowContext`** — this is what makes coherence work and prevents regression to faker-style random output.

```
RowContext {
  personId         // stable id for the row's "person"
  firstName, lastName
  domain           // chosen once, reused by email/url
  locationTuple    // { city, state, zip, country, lat, lng } from ONE bundled row
  baseTimestamp    // anchor; MUST derive from the seed (hashed), NOT wall-clock
}
```
Each generator: `gen(ctx, options, rng)` — pulls shared identity from `ctx` (lazily created), never rolls its own.

### Determinism rules (hard requirements)
- `baseTimestamp` derives from the seed (hash of seed string), **never `Date.now()`**. Otherwise seeded runs won't reproduce across days.
- Nothing in the seeded path may call `Date.now()` or `crypto.randomUUID()`. Seeded UUIDs are rng-derived v4.
- The PRNG must consume the **same number of draws per row regardless of branches taken**. Branch-dependent draw counts break byte-identical reproducibility.
- **Stable key ordering**: rely on deterministic insertion order; be deliberate, don't reorder mid-walk.

### Coherence = declarative `CoherenceRules[]` (extensible, not hard-coded)
Data-driven rules array (not fixed `if`s) so v2 can add per-schema / override / conditional / user-defined rules with no rewrite. Engine **topologically sorts by `dependsOn` with cycle detection** (throw a clear error on a circular `dependsOn` — never hang or emit partial output), evaluates per row against `RowContext`. A field's generator runs normally **unless** a `CoherenceRule.target` matches, in which case `formula(ctx, rng)` wins.

`target` is an **array of field names** (not a pipe-delimited string), to avoid reserved-character collisions when a field is inferred with an odd name.

```js
CoherenceRules = [
  { target: ["fullName"], dependsOn: ["firstName","lastName"], formula: ctx => `${ctx.firstName} ${ctx.lastName}` },
  { target: ["email"],    dependsOn: ["firstName","lastName","domain"], formula: ctx => `${slug(ctx.firstName)}.${slug(ctx.lastName)}@${ctx.domain}` },
  { target: ["username"], dependsOn: ["firstName","lastName"], formula: (ctx,rng) => slug(ctx.firstName)+slug(ctx.lastName)+suffix(rng) },
  { target: ["city","state","zip","country","lat","lng"], dependsOn: ["locationTuple"], formula: ctx => ctx.locationTuple },
  { target: ["updatedAt"], dependsOn: ["createdAt"], formula: ctx => onOrAfter(ctx.createdAt) },
  { target: ["avatarUrl","url"], dependsOn: ["domain"], formula: ctx => `https://${ctx.domain}/...` }
]
```

### `js/mock-data-faker.js` (zero-dependency, dual-export)
- **Seedable PRNG** (mulberry32 seeded by hashing the seed string); ALL randomness routes through it. Seed set → rng-derived UUID v4 (deterministic); else `crypto.randomUUID()`.
- **Bundled en-US data**: first/last names, domains, coherent location tuples (city↔state↔zip↔country↔lat/lng), streets, companies, job titles, words/lorem, colors, currencies.
- **Generator registry** (context-aware): `uuid, id, firstName, lastName, fullName, username, email, phone, avatarUrl, url, domain, ipv4, ipv6, mac, country, city, state, zip, streetAddress, latitude, longitude, datetime, date, time, timestamp, int, float, price, boolean, word, words, sentence, paragraph, company, jobTitle, color, currency, enum, constant, null`.
- Per-field optional **null-chance**; `locale` param (`en-US` default, structured for more).

---

## Internal model: `MockSchema`
All entry points compile to one ordered spec, **`MockSchema`** (SEO-aligned, OpenAPI-future-proof): `[{ name, generator, options, nullChance }]`; a field may be `object` (children) or `array` (item-`MockSchema` + count). Engine walks `MockSchema` per row, applies coherence via `RowContext`, emits objects. Formatters consume the array.

### Three entry points → `MockSchema`
1. **Field picker** — rows of (name + generator dropdown + options); add/remove/reorder; nested objects + arrays. Direct `MockSchema`. (Table-stakes + "visual schema builder" SEO.)
2. **From sample JSON (MAIN)** — parse; if array, `mergeSchemas` across items; infer each field's generator from **key-name heuristics + value pattern**.
   - **Precedence**: detected **value pattern WINS** over key-name heuristic when they conflict (`"id": 42` → int, **not** uuid; key-name heuristic is only the fallback for ambiguous/missing values).
   - On **type disagreement across array items** for the same field, apply a defined, **order-independent tie-break** (default: widen to `string`; document the choice) so inference doesn't depend on item order.
   - Generate N rows shaped like the sample.
3. **From JSON Schema (minimal subset)** — parse `type, properties, required, items, enum, format, minimum/maximum, minItems/maxItems`; map `format`→generator (`email, uuid, date-time, uri, ipv4`). No OpenAPI/`$ref` in v1 (UI notes the limit).

---

## Controls & exports
Row count (default 10; **chunked generation** + soft guard ~100k), seed (optional → deterministic), output-format selector, Generate / Copy / Download, live size via `getJSONSize`.
- **JSON array**: `JSON.stringify(rows, null, 2)`
- **NDJSON**: `rows.map(r => JSON.stringify(r)).join('\n')`
- **CSV**: reuse `jsonToCSV`. **Nested-flattening rule**: dot-notation columns (`{a:{b:1}}` → column `a.b`). **Warn or disable CSV when the schema has nesting depth** (especially likely in sample mode, where deep nesting makes CSV near-useless).
- **Soft-guard UX** (pick precisely): at ~100k → **warn-and-proceed** (chunked) with a visible notice; **block only above a hard ceiling**. Nail this before building the chunked path.
- **Live size readout**: `getJSONSize` must be **debounced and estimated at high N** (don't full-stringify the entire set on every change — it janks at 100k).
- **Privacy banner**: "100% client-side — data never leaves your browser. Works offline. No row cap."

---

## SEO architecture (crawl-depth + long-tail) — TWO WAVES
**Rationale**: shipping 8 thin/templated SEO assets at once on a site suspected to be in/exiting sandbox is a worse risk profile than the tool alone. Stagger it — reduces helpful-content risk and reveals which template converts before building three. Every asset cross-links; all in `sitemap.xml`; **no orphan pages**.

### Wave 1 — ships WITH the tool (v1-core)
- Tool page `mock-data-generator.html` (BreadcrumbList + WebApplication + FAQPage schema, **no HowTo**).
- `generate-json-from-example.html` — the **differentiated moat landing** ("generate JSON from example", "expand JSON data", "infer JSON structure"). CTA deep-links `mock-data-generator.html?mode=sample`.

### Wave 2 — fast-follow, AFTER the tool page indexes & earns some authority
- **Cluster hubs**: `mock-data-tools.html`, `schema-tools.html` (master hub `json-tools.html` links to both).
- **Landing pages**: `mockaroo-alternative.html` ("mockaroo alternative / free unlimited / client-side"), `fakerjs-alternative.html` ("faker.js alternative / no dependency / just want JSON").
- **Example pages**: `examples/user.html`, `examples/ecommerce.html`, `examples/logistics.html` + raw `examples/<name>.json`. Realistic dataset + explanation + "Generate more like this →" CTA into prefilled sample mode. Templated; add more over time.
- Raw `.json` files must be set **non-indexed (or canonical-to-HTML)** so they don't split ranking signals with their example pages.
- Wire the hub→tool→landing→examples link graph.

---

## Files to CREATE

### Wave 1 (with tool)
- [ ] `mock-data-generator.html` — tool page (scaffold; BreadcrumbList + WebApplication + FAQPage schema, **no HowTo**). Reads `?mode=sample|schema|fields` to open the right tab and optionally prefill a sample.
- [ ] `js/mock-data-faker.js` — engine (PRNG + data + `RowContext` + `CoherenceRules[]` + generator registry).
- [ ] `js/mock-data-generator-tool.js` — 3 mode tabs → compile to `MockSchema` → run engine (chunked) → render + export; `debounce` live preview; query-param deep-linking.
- [ ] `generate-json-from-example.html` — moat landing page.

### Wave 2 (fast-follow)
- [ ] `mockaroo-alternative.html`, `fakerjs-alternative.html` — landing pages.
- [ ] `mock-data-tools.html`, `schema-tools.html` — cluster hubs.
- [ ] `examples/user.html`, `examples/ecommerce.html`, `examples/logistics.html` + raw `examples/user.json`, `examples/ecommerce.json`, `examples/logistics.json`.

## Files to MODIFY
- [ ] `js/navbar-component.js` — add tool under **Generators** (Wave 1); add the two hubs (Wave 2).
- [ ] `json-tools.html` — feature card for the tool (Wave 1); links to the two hubs (Wave 2).
- [ ] `sitemap.xml` — tool 0.80 (Wave 1); hubs 0.70 / landing 0.70 / examples 0.60 / raw `.json` optional (Wave 2).
- [ ] Cross-links to the tool from `json-schema-generator.html`, `json-to-typescript.html`, `json-schema-validator.html`, `blog/json-schema-from-multiple-samples.html`; back-links in the tool's Related Tools.

---

## Build order

### v1-core — ship & index ✅ DONE
1. [x] `js/mock-data-faker.js` — PRNG + data tables + `RowContext` + **coherence rules (with cycle detection)** + generator registry.
2. [x] `mock-data-generator.html` shell + `js/mock-data-generator-tool.js` field-picker mode → JSON output.
3. [x] NDJSON + CSV exporters (**dot-notation flattening + nesting warning**) + copy/download + **debounced size readout**.
4. [x] **Sample-paste mode (MAIN)** — inference adapted from `inferSchema`/`mergeSchemas`; **value-pattern-over-key-name precedence**; **type-disagreement tie-break**.
5. [x] Minimal JSON Schema subset mode.
6. [x] Seed determinism + chunked large-N + soft guard.
7. [x] SEO content + schema on the tool page; query-param deep-linking (`?mode=`); **`generate-json-from-example.html` moat landing (ships with core)**.

### Fast-follow — not a launch blocker
8. [ ] **Wave 2 SEO asset layer**: 2 landing + 2 hubs + 3 example pages (+ raw `.json`); wire the link graph; register nav / `json-tools.html` / `sitemap.xml`; cross-links.

---

## Verification ✅ (Node smoke tests + Playwright, 0 console errors)
1. [x] Each mode round-trips: `JSON.parse(output)` ok; every NDJSON line parses; CSV opens.
2. [x] **Determinism**: same seed + same `MockSchema` → byte-identical output across two runs; differs when seed changes. Also: **identical output across different machines/dates** (catches wall-clock leakage and branch-dependent draw counts).
3. [x] **Coherence**: `email`/`username`/`fullName` derive from `firstName`/`lastName`; `city/state/zip/country` share one tuple; `updatedAt >= createdAt` (incl. snake_case `created_at`).
4. [x] **Cycle detection**: a circular `dependsOn` in `CoherenceRules` throws a clear error rather than hanging.
5. [x] **Adversarial inference**: a sample with integer `id` and a field whose type disagrees across items resolves correctly (value pattern beats key name) and deterministically (tie-break is order-independent).
6. [x] **Volume**: 100k rows chunked without freezing; soft-guard notice past cap behaves as specified; hard cap at 1M.
7. [x] Nested objects + arrays correct; null-chance respected; **CSV dot-notation columns correct; CSV warning fires on nested schemas**.
8. [x] Dark mode + mobile (no horizontal overflow at 375px); copy/download; valid JSON-LD; visible `<details>` == FAQPage count; meta ≤160; canonical correct.
9. [x] Declarative coherence: adding a `CoherenceRule` changes output without touching generator code.

### Wave 2 verification (when shipped)
- [ ] Every Wave 2 asset resolves + in `sitemap.xml`. Each landing/example CTA deep-links the correct mode (`?mode=sample` etc.) and prefills where promised. Hub↔tool↔landing↔examples links resolve both directions (no orphans). Raw `.json` files are **non-indexed / canonical-to-HTML**.

---

## v2 — Next iteration (after v1 ships & indexes)
Each builds on the v1 `MockSchema` + `RowContext` engine; no rewrite.

1. [ ] **SQL INSERT export.** Table-name input; columns = top-level keys; escape strings/dates; batched multi-row `INSERT`s; type-map (string→quoted, number→raw, bool→TRUE/FALSE, null→NULL, date→ISO quoted). Backend/db-seeding segment. New formatter only.
2. [ ] **OpenAPI + `$ref` + JSON-Schema 2020-12.** Extend the parser: resolve **local `$ref`** (`#/components/schemas/...`, `#/$defs/...`); read `components.schemas.<Name>` or a selected path+response; handle `allOf`/`anyOf`/`oneOf`, `pattern`, `nullable`/`type:["string","null"]`. (External/remote `$ref` stays out — client-side, no fetch.)
3. [ ] **Relational / linked entities (the moat).** Multi-entity mode + foreign-key links (`orders.userId` ∈ generated `users.id`); generate parents → children sample real parent keys; export multiple files/tables. Explicitly hard = differentiation.
4. [ ] **Multi-locale data.** Promote `locale` to real coverage (e.g. `en-GB, de-DE, fr-FR, es-ES, ja-JP`): locale-specific name/address/phone tables + coherent location tuples. Engine already locale-parameterized.
5. [ ] **"Fake REST API" bridge.** Static site = no hosting: one-click **download a `db.json`** ready for `json-server` + copyable config; optional shareable URL encoding the `MockSchema` (not the data).
6. [~] **More SEO landing pages** once ranking: "free unlimited mock data generator", "mock data generator no signup", "generate data from JSON Schema", "JSONPlaceholder/DummyJSON alternative" — thin pages funnelling to the tool.
   - [x] `blog/mockaroo-alternative.html` — "Free Mockaroo Alternative" (built 2026-06-28; comparison table, FAQ schema, CTAs → tool, registered in sitemap + linked from tool page). Lives in `/blog/` to match existing `*-alternative` comparison pages.
   - [x] `blog/random-user-generator.html` — "Random User Generator" (built 2026-06-28; coherent-user angle, example output, FAQ schema, registered + linked). Moved to `/blog/` per the convention that funnel/SEO pages live under blog.
   - [ ] remaining candidates below — build as the tool ranks. HOLD "SQL Test Data" until v2 #1 (SQL export) ships and "Mock REST API Data" until v2 #5 (fake-API bridge) ships, so the landing page doesn't overpromise a feature the tool lacks.
![alt text](image.png)
Generate Mock JSON

Generate Fake API Data

Generate SQL Test Data

Generate CSV Data

Random User Generator

JSON Schema Generator

Fake Ecommerce Orders

Generate Test Database

Mock REST API Data
7. [ ] **Quality/coherence depth.** Locale-correct phone formats, more coherent tuples (company↔email domain, jobTitle↔department), regex-`pattern` generator, weighted enums.

**v2 verification adds:** SQL parses in SQLite; resolved `$ref` schemas generate conforming data; child FK values always exist in parents; each locale yields locale-appropriate, still-coherent rows.
