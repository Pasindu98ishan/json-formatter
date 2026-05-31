# Phase 6 — Blog Expansion & New Tools

**Status**: In progress  
**Last Updated**: 2026-05-29

---

## Previously Completed (moved from Phase 5)

- `blog/api-returning-html-instead-of-json.html` ✅
- `blog/json-parse-unexpected-token-o.html` ✅
- `blog/json-parse-returns-string-not-object.html` ✅

---

## Completed in Phase 6

### Tools
- `json-schema-generator.html` ✅ — T2 tool, pure JS type inference, draft-07 output, 4 samples, format hints (email/uuid/date-time/uri), anyOf for mixed arrays
- `js/json-schema-generator-tool.js` ✅ — standalone tool JS, no CDN dependency
- `text-diff.html` ✅ — T3 tool, pure JS LCS diff engine (no CDN), two-panel side-by-side output with line numbers, green/red row highlighting, ignore-case + ignore-whitespace toggles, Copy diff button, summary badges; added to navbar under "JSON Tools → Text Diff"; sitemap updated

### Blog Posts
- `blog/kafka-avro-schema.html` ✅ — Kafka + Avro schema deep-dive; Article, FAQPage (5 Q&A), BreadcrumbList, HowTo (4 steps)
- `blog/yaml-vs-json.html` ✅ — B2, enhanced with decision table, YAML pitfalls (Norway problem, tabs, number coercion), 2 extra FAQ items; dateModified 2026-05-26
- `blog/json-stringify-indent.html` ✅ — B3, merged with json-stringify-options (reviver, dropped-values table, deep-clone); retitled "Complete Guide"
- `blog/jackson-json-serialization.html` ✅ — Java Jackson serialization/deserialization, TypeReference for lists, @JsonIgnore vs transient, Java 8 dates/records, 5 common exceptions; full structured data
- `blog/json-null-vs-undefined.html` ✅ — C1, covers all 3 undefined cases, replacer pattern, key-in-obj detection, Python/Java/Go/Rust table, 3 common bug examples, JSON Schema null; matches article-header / blog-article structure
- `blog/compare-two-text-files.html` ✅ — Text Diff supporting post; long-tail "how to compare two text files online", "diff checker online", "find difference between two texts"; HowTo (4 steps) + Article + BreadcrumbList + FAQPage (6 Q&A, synced to visible FAQ); links to text-diff.html + json-diff.html; cross-linked from text-diff.html "Related Guides"
- `blog/protobuf-vs-json.html` ✅ — comparison post; "protobuf vs json", "is protobuf faster than json", "protocol buffers vs json size"; Article + BreadcrumbList + FAQPage (6 Q&A, synced to visible FAQ); quick-comparison + when-to-use tables, side-by-side .proto/JSON example, accurate size/speed claims; extends comparison cluster (json-vs-xml, yaml-vs-json)

### Homepage & UI
- Hero section redesigned: compact two-column layout, mini formatter terminal, blue gradient CTA button, plain trust badges, blinking caret hint, centered grid with `minmax(0,460px) minmax(0,520px)`, "Save for later" bookmark nudge (4s delay, bottom-right, localStorage gate)
- Mobile: terminal hidden on mobile, navbar fixed to single row (logo left, hamburger+Dark right), hero headline scales up, 2-column tool cards

---

## Part A — Blog Posts

### Universal Rule: Copy Buttons on All Code Snippets

Every `<pre><code>` block in new blog posts must have a "Copy" button. Implementation: `<button class="copy-code-btn">Copy</button>` absolutely positioned top-right of each `<pre>`, wired via `navigator.clipboard.writeText()`. Increases user engagement signals (clicks, dwell time) that Google uses as quality indicators.

---

### P1 Blog Posts — Write These First

#### B1 — `what-is-json-schema.html` ✅ Done
- **Target keywords:** "what is json schema", "json schema example", "json schema tutorial"
- **Est. volume:** ~8k/mo

#### B2 — `yaml-vs-json.html` ✅ Done
- **Target keywords:** "yaml vs json", "yaml vs json which is better", "yaml vs json speed"
- **Est. volume:** ~15k/mo

#### B3 — `json-stringify-indent.html` ✅ Done (merged with json-stringify-options)
- **Target keywords:** "JSON.stringify indent", "JSON.stringify replacer", "json stringify pretty print"
- **Est. volume:** ~5k/mo

#### B4 — `json-trailing-comma.html` ✅ Done
- **Target keywords:** "json trailing comma error", "remove trailing comma json"
- **Est. volume:** ~3k/mo

#### B5 — `env-file-format.html` ✅ Done
- **Target keywords:** ".env file format", "dotenv file syntax"
- **Est. volume:** ~4k/mo

---

### P2/P3 Blog Posts — Lower Priority (write after B1–B5)

#### C1 — `json-null-vs-undefined.html` ✅ Done
- **Target:** "json null vs undefined", "undefined in json"
- **Angle:** JSON has no `undefined` — all 3 stringify cases, replacer pattern, key-in-obj detection, cross-language table, 3 bug examples

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

#### T3 — Text Diff Tool ✅ Done
- **File:** `text-diff.html`
- **Keyword:** "text diff online", "compare two strings online", "diff checker" — ~15k/mo
- **Built:** Pure JS LCS engine (no CDN), ignore-case + ignore-whitespace toggles, side-by-side line-numbered output, Copy diff button, summary badges; added to navbar + sitemap

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

1. ✅ **Blog posts B1–B5** — complete
2. ✅ **T1 + T2** — JSON Schema Validator + Generator — complete
3. ✅ **T3** — Text Diff — complete
4. ✅ **C1** — json-null-vs-undefined — complete
5. ⬜ **T4** — String Escape/Unescape (`string-escape.html`) — next tool
7. ⬜ **Content enrichment** — Base64, UUID, JWT, Timestamp, Hash pages
8. ⬜ **T3b** — Schema from Multiple JSON Samples
9. ⬜ **T5–T8** — TOML, HTTP Status, Chmod, Markdown (in priority order)
