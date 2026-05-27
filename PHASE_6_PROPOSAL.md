# Phase 6 — Blog Expansion & New Tools

**Status**: In progress  
**Last Updated**: 2026-05-23

---

## Previously Completed (moved from Phase 5)

- `blog/api-returning-html-instead-of-json.html` ✅
- `blog/json-parse-unexpected-token-o.html` ✅
- `blog/json-parse-returns-string-not-object.html` ✅

---

## Completed in Phase 6

- `json-schema-generator.html` ✅ — T2 tool, pure JS type inference, draft-07 output, 4 samples, format hints (email/uuid/date-time/uri), anyOf for mixed arrays
- `js/json-schema-generator-tool.js` ✅ — standalone tool JS, no CDN dependency
- `blog/kafka-avro-schema.html` ✅ — Kafka + Avro schema deep-dive: what Avro is, backward/forward/full compatibility tables, aliases rename pattern, Schema Registry API, real evolution example. Targets new + mid-level devs. Links to json-schema-generator, json-schema-validator, formatter, json-diff. Full AEO/GEO structured data: Article, FAQPage (5 Q&A), BreadcrumbList, HowTo (4 steps).

---

## Part A — Blog Posts

### Universal Rule: Copy Buttons on All Code Snippets

Every `<pre><code>` block in new blog posts must have a "Copy" button. Implementation: `<button class="copy-code-btn">Copy</button>` absolutely positioned top-right of each `<pre>`, wired via `navigator.clipboard.writeText()`. Increases user engagement signals (clicks, dwell time) that Google uses as quality indicators.

---

### P1 Blog Posts — Write These First

#### B1 — `what-is-json-schema.html`
- **Target keywords:** "what is json schema", "json schema example", "json schema tutorial"
- **Est. volume:** ~8k/mo — no single tool page dominates
- **Internal links:** `json-validator.html`, `formatter.html`
- **Pairs with:** JSON Schema Validator tool (see Part B)
- **Angle:** Explain what JSON Schema is, why it matters for API validation, show $schema, type, required, properties with real examples

#### B2 — `yaml-vs-json.html`
- **Target keywords:** "yaml vs json", "yaml vs json which is better", "yaml vs json speed"
- **Est. volume:** ~15k/mo — comparison articles rank well for this query
- **Internal links:** `yaml-to-json.html`, `json-to-yaml.html`, `yaml-validator.html` (Phase 5)
- **Angle:** Side-by-side syntax comparison, readability, use cases (config files vs APIs), when to use each

#### B3 — `json-stringify-options.html`
- **Target keywords:** "json stringify pretty print", "JSON.stringify indent", "JSON.stringify replacer", "JSON.stringify space"
- **Est. volume:** ~5k/mo — developers look this up constantly
- **Internal links:** `formatter.html`
- **Angle:** Full breakdown of all 3 arguments (value, replacer, space); show indent=2 trick, array replacer, function replacer, and reviver in JSON.parse

#### B4 — `fix-json-trailing-comma.html`
- **Target keywords:** "json trailing comma error", "remove trailing comma json", "json trailing comma not allowed"
- **Est. volume:** ~3k/mo — exact-match error message searches
- **Internal links:** `formatter.html`, `json-validator.html`
- **Pairs with:** Repair button (Phase 5 Task 3)
- **Angle:** Why JSON doesn't allow trailing commas, how to spot them, automated fix using the Repair tool

#### B5 — `env-file-format.html`
- **Target keywords:** ".env file format", "dotenv file syntax", "what is .env file", "how to write .env file"
- **Est. volume:** ~4k/mo
- **Internal links:** `env-parser.html` (Phase 5 Task 6)
- **Angle:** Full .env syntax guide: KEY=VALUE, comments, quotes, multiline, special characters; common mistakes; Docker vs Node.js loading

---

### P2/P3 Blog Posts — Lower Priority (write after B1–B5)

#### C1 — `json-null-vs-undefined.html`
- **Target:** "json null vs undefined", "undefined in json"
- **Angle:** JSON has no `undefined` — what happens when you stringify `undefined`, how to handle it

#### C2 — `json-date-format.html`
- **Target:** "json date format", "how to store dates in json", "iso 8601 json"
- **Angle:** ISO 8601 as the standard, JS Date serialization, timezone handling, common mistakes

---

## Part B — New Tools

### Priority 1 — Highest Value (build first)

#### T1 — JSON Schema Validator  ✅ Done
- **File:** `json-schema-validator.html`
- **Keyword:** "validate json against schema" — ~5k/mo
- **Why:** No dominant easy online tool for this; pairs directly with blog B1
- **Library:** `ajv` (Ajv JSON Schema validator) from CDN: `https://cdn.jsdelivr.net/npm/ajv@8/dist/ajv.min.js`
- **What it does:**
  - Two input panels: JSON input + JSON Schema input
  - Validate button → Ajv validates JSON against schema → shows errors with path + message
  - Sample button loads a working JSON + schema pair
- **Nav:** Add to "JSON Tools" dropdown

#### T2 — JSON Schema Generator ✅ DONE
- **File:** `json-schema-generator.html`
- **Keyword:** "generate json schema from json" — ~3k/mo
- **Completed:** 2026-05-23
- **Features built:** recursive type inference, format hints (email/uuid/date-time/uri), anyOf for mixed arrays, 4 samples, Copy Schema button, links to Schema Validator and Kafka Avro blog post

#### T3 — Text Diff Tool
- **File:** `text-diff.html`
- **Keyword:** "text diff online", "compare two strings online", "diff checker" — ~15k/mo
- **Why:** Extends existing `json-diff.html` to generic text; much broader audience; easy to build
- **Library:** `diff` by kpdecker from CDN: `https://cdn.jsdelivr.net/npm/diff@5/dist/diff.min.js`
- **What it does:**
  - Two text panels (no JSON requirement)
  - Diff button → line-by-line diff with added/removed highlighting
  - Reuse diff CSS from `json-diff.html`
- **Nav:** Add to "JSON Tools" dropdown as "Text Diff"

#### T3b — Schema from Multiple JSON Samples *(planned 2026-05-24)*
- **File:** `json-schema-multi-generator.html` + `js/json-schema-multi-generator.js`
- **Keyword:** "generate json schema from multiple json", "json schema from examples", "merge json schemas online" — ~300–700/mo (very few tools do this; low competition)
- **Why:** Single-sample inference can't detect optional fields or nullable types. Multi-sample merging solves a real pain point for API teams with no clean web tool to do it. Reuses `inferSchema` logic already built; new `mergeSchemas()` function handles union of types and required-field intersection. Differentiator — quicktype only does it via CLI.
- **Algorithm:**
  - Parse each sample with existing `inferSchema()`
  - Fold schemas pairwise with `mergeSchemas(a, b)`: merges types to arrays, makes fields absent in any sample nullable, intersects `required` lists, recurses into nested objects and arrays
  - Simple/Smart Mode toggle (same as generator — localStorage `jsg_multi_smart_mode`)
- **UI:** Left panel = 2–5 textarea slots (Add/Remove Sample buttons); right panel = merged schema output + Copy button
- **Nav:** Add to "JSON Tools" dropdown as "Schema from Multiple JSON"
- **Companion blog post:** `blog/json-schema-from-multiple-samples.html` — targets "why json schema inference is wrong", "json schema optional fields", "nullable fields json schema"

#### T4 — String Escape / Unescape
- **File:** `string-escape.html`
- **Keyword:** "json string escape online", "escape special characters json", "unescape json string" — ~4k/mo
- **Why:** Exact-match keyword, no dominant tool, fast to build (pure JS), high utility for API devs
- **Library:** None — pure JS (`JSON.stringify`/`JSON.parse` + regex)
- **What it does:**
  - Input: raw string with special characters
  - Escape: wraps in `JSON.stringify()` → shows escaped result
  - Unescape: strips outer quotes and unescapes → shows raw string
  - Two-way live conversion
- **Nav:** Add to "Encoders" dropdown

---

### Priority 2 — Medium Value

#### T5 — TOML to JSON
- **File:** `toml-to-json.html`
- **Keyword:** "toml to json converter", "toml to json online" — ~2k/mo
- **Why:** Growing Rust/cargo ecosystem; no clean online converter exists
- **Library:** `@iarna/toml` or `smol-toml` from CDN
- **What it does:** Parse TOML input, output formatted JSON
- **Nav:** Add to "Converters" dropdown

#### T6 — HTTP Status Codes Reference
- **File:** `http-status-codes.html`
- **Keyword:** "http status codes list", "what is 404 error", "http 500 status code" — ~20k/mo total
- **Why:** Static reference page; easy to rank for long-tail "what is [code]" queries; no coding needed
- **Library:** None — pure HTML table
- **What it does:** Full list of 1xx–5xx status codes with descriptions, grouped by category, searchable/filterable
- **Nav:** Add as standalone link or under a "Reference" section

#### T7 — Chmod Calculator
- **File:** `chmod.html`
- **Keyword:** "chmod calculator", "unix permissions calculator", "chmod 755 meaning" — ~8k/mo
- **Why:** Different audience (sysadmins/DevOps), easy to build, no dependencies, no JSON overlap
- **Library:** None — pure JS bit manipulation
- **What it does:**
  - Checkboxes for owner/group/other × read/write/execute
  - Shows numeric mode (755, 644, etc.) and symbolic (`rwxr-xr-x`) in real time
  - Reverse: type a number → checkboxes update
- **Nav:** Add to "Generators" (rename to "Generators & Utils") or new "Utilities" section

#### T8 — Markdown to HTML
- **File:** `markdown-to-html.html`
- **Keyword:** "markdown to html online", "markdown converter" — ~8k/mo
- **Why:** Dev tools adjacent; moderate effort; good internal link target for blog posts
- **Library:** `marked.js` from CDN: `https://cdn.jsdelivr.net/npm/marked@9/marked.min.js`
- **What it does:** Two panels — Markdown input, HTML output with live preview toggle
- **Nav:** Add to "Converters" dropdown

---

### Priority 3 — Lower Priority

#### T9 — Color Code Converter
- **File:** `color-converter.html`
- **Keyword:** "hex to rgb", "rgb to hsl", "color converter online" — ~40k/mo total
- **Why:** Huge volume but competitive (coolors.co, color-hex.com dominate); still worth it as a simple utility
- **Library:** None — pure JS color math
- **What it does:** HEX ↔ RGB ↔ HSL live conversion with color swatch preview
- **Nav:** Add to "Converters" or new "Utilities" section

---

## Part C — Content Enrichment (Existing Tools)

These tools already exist but their pages are thin. Adding more content = higher ranking for high-volume keywords.

| Tool | Primary keyword | Est. volume | What to add |
|------|----------------|-------------|-------------|
| `base64.html` | "base64 encode decode online" | ~50k/mo | Info section, character set explanation, use cases table, 6-item FAQ |
| `uuid.html` | "uuid generator online" | ~30k/mo | UUID v4 vs v1 vs v5 explanation, FAQ, use cases |
| `url-encoder.html` | "url encode online" | ~25k/mo | ✅ Already enriched in Phase 5 |
| `jwt-decoder.html` | "jwt decoder online" | ~12k/mo | Header/payload/signature explanation, algorithm table, security FAQ |
| `timestamp.html` | "unix timestamp converter" | ~10k/mo | What is Unix time, epoch explanation, timezone table, FAQ |
| `hash.html` | "md5 generator online" | ~8k/mo | MD5 vs SHA-256 comparison, use cases, collision risk note, FAQ |

---

## Part D — Not Recommended

| Tool | Reason to skip |
|------|---------------|
| **SQL Formatter** | sql-formatter.com dominates; very complex parser to build correctly |
| **Regex Tester** | regex101.com has a near-monopoly; not worth competing |
| **IP Subnet Calculator** | Different audience; high effort; no synergy with existing tools |
| **JSON to SQL** | Very niche; low search volume; complex edge cases |

---

## Execution Order

1. **Blog posts first** (B1–B5) — builds internal link targets for new tools
2. **T1 + T2** — JSON Schema Validator + Generator (paired with blog B1)
3. **T3** — Text Diff (broad audience, fast to build)
4. **T4** — String Escape/Unescape (exact-match keyword, 1 hour to build)
5. **Content enrichment** — Base64, UUID, JWT, Timestamp, Hash pages
6. **T5–T8** — TOML, HTTP Status, Chmod, Markdown (in priority order)
7. **C1, C2 blog posts** — after tools are live (internal links ready)
