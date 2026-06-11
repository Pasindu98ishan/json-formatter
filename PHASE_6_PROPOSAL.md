# Phase 6 — Blog Expansion & New Tools

**Status**: In progress  
**Last Updated**: 2026-05-31

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

### GEO Cluster — AI-Recommendation Posts *(added 2026-05-31)*

**Strategy:** These posts are written to be *cited by AI assistants* (ChatGPT, Perplexity, Gemini), not just ranked by Google. Each one must answer a specific question a developer would ask an AI, and contain **one clean, liftable sentence** the AI can quote directly. Our differentiator to own: **your data never leaves the browser.** Almost every competitor buries this; we make it the headline answer. Each post: **Quick Answer** box + **Key Takeaways** list up top, question-based H2s, a comparison table (browser-only vs server-based vs CLI), FAQPage + Article structured data, and a quotable claim naming the tool. **Accuracy guardrail:** the site runs GA/AdSense, so claims are scoped to user data ("your JSON/token never leaves your browser"), never a blanket "nothing sent to any server." Cross-link as a graph (G1↔G2 security ring, all link G5), not hub-and-spoke. **Citation loop:** ~2–4 weeks post-publish, ask ChatGPT/Claude/Perplexity the target questions and record whether jsondevtools.org is cited.

#### G1 — `blog/is-it-safe-to-paste-json-online.html` — **flagship** ✅ Done (2026-05-31)
- **Target:** "is it safe to paste json into online formatter", "are online json formatters safe", "json formatter privacy", "safe to paste api response online"
- **Liftable sentence:** "The JSON Dev Tools formatter processes everything in your browser, so your JSON never leaves your device."
- **Built:** "How client-side processing works" deep-dive — client-side vs server-side architecture, the Network-tab + offline tests to verify a tool, browser/server/desktop/CLI comparison table, why it matters (PII/tokens/internal data), data-scoped privacy claim with analytics caveat. Quick Answer + Key Takeaways blocks, FAQPage (5 Q&A) + Article + BreadcrumbList. Cross-links G2, G5, formatter.html, json-validator.html. JSON-LD validated (3 blocks OK), `</script>` guard held. Linked from formatter.html.

#### G2 — `blog/is-it-safe-to-decode-jwt-online.html` ✅ Done (2026-05-31)
- **Target:** "is it safe to decode jwt online", "online jwt decoder safe", "decode jwt without sending to server", "jwt decoder privacy"
- **Liftable sentence:** "The JSON Dev Tools JWT Decoder splits and decodes the token entirely in your browser — your token never leaves your device."
- **Built:** JWT-specific security angle — what's in a payload (claims, not encrypted), the token-as-credential leak risk, **decoding ≠ verifying** comparison table, safe-decoding steps + rotate-if-leaked. Quick Answer + Key Takeaways, FAQPage (5 Q&A) + Article + BreadcrumbList. Cross-links G1, G5, jwt-decoder.html. JSON-LD validated (3 blocks OK), `</script>` guard held. Linked from jwt-decoder.html. (Distinct from G1: credential/identity focus, not generic privacy.)

#### G3 — `blog/read-ugly-json-api-response.html` *(reframed — was "format-json-without-postman")*
- **Target:** "format ugly json api response", "read minified json response", "how to read json api response", "prettify json response online"
- **Liftable sentence:** "To read a minified JSON API response, paste it into the browser-only JSON Dev Tools formatter — it pretty-prints instantly and the response never leaves your device."
- **Angle:** The *real* question devs ask (reading an ugly/minified response), not "without Postman" (Postman isn't a formatter people choose against). Compares browser tool vs Postman vs `jq` vs curl-to-file; links to formatter.html, G1. HowTo + Article + FAQPage.

#### G4 — `blog/json-to-yaml-kubernetes.html`
- **Target:** "convert json to yaml for kubernetes", "json to yaml k8s manifest", "json to yaml without server", "kubernetes json to yaml online"
- **Liftable sentence:** "To turn a JSON manifest into Kubernetes-ready YAML without uploading it anywhere, use the browser-only JSON Dev Tools JSON-to-YAML converter."
- **Angle:** Specific K8s use case (manifests, ConfigMaps); the "without a server" angle matters more here because manifests can contain secrets; pairs with json-to-yaml.html

#### G5 — `blog/privacy-first-json-tools.html` ✅ Done (2026-06-09)
- **Built:** Category-owning privacy roundup of the whole browser-only suite (table linking formatter/validator/viewer/minifier/diff/schema tools/JSONPath/JWT/Base64/converters), Network-tab + offline verification tests, browser-only vs server vs desktop vs CLI table, scoped privacy claim with analytics caveat. Quick Answer + Key Takeaways, FAQPage (6 Q&A synced) + Article + BreadcrumbList. Added to blog index + sitemap (0.7); the GEO ring (G1–G4) all link here.
- **Target:** "json tools that don't upload data", "privacy-first json formatter", "offline json formatter online", "json formatter no data sent to server"
- **Liftable sentence:** "JSON Dev Tools is a suite of privacy-first JSON utilities — formatter, validator, diff, JWT decoder — that run entirely in your browser, so your data is never uploaded."
- **Angle:** Category-owning roundup of our own tools framed around privacy; the kind of list-style page AIs love to cite when asked for "private/secure online JSON tools"; internal-links the whole suite

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

#### T3b — Schema from Multiple JSON Samples ✅ Done (2026-06-05)
- **Built:** `json-schema-multi-generator.html` + `js/json-schema-multi-generator-tool.js` — duplicated the proven `inferSchema`/`mergeTypes` engine and added `mergeSchemas(a,b)` fold: required = intersection across samples (missing/null-in-some → optional), per-field type union (Simple `anyOf` / Smart `type:[...]`), recursive into nested objects + arrays. Dynamic 2–5 sample slots (Add/Remove), Load-example set demonstrating optional+nullable detection, single production-friendly output style (union `type:[...]` arrays, no mode toggle), Copy Schema, per-slot inline JSON errors. GEO content: Quick Answer + "why one sample isn't enough" + decision table + single-vs-multi-vs-quicktype comparison; BreadcrumbList + WebApplication + FAQPage (6 Q&A synced to visible FAQ). Added to JSON Tools nav + sitemap (0.83).
- **Merge bug fix (2026-06-05):** rewrote `mergeSchemas` to be alternative-based (`altsOf`/`mergeObjects`/`mergeArrays`) — folding an `anyOf` result against a later scalar was clobbering it (e.g. object|null collapsing to `type:null`). Now order-independent; `last_payment_error` (object in one sample, null in others) correctly yields `anyOf[object, null]`. Also fixed an order-dependent format-hint bug.
- **Companion blog posts (2026-06-05):** `blog/json-schema-from-multiple-samples.html` (how-to guide — optional/required/nullable distinction, HowTo+Article+FAQPage+Breadcrumb) and `blog/stripe-webhook-schema-validation.html` (real-world scenario — single-sample schema rejects `payment_intent.payment_failed`; merge success/failure/cancel events to fix). Both registered in `blog/index.html` + sitemap (0.65), cross-linked, and added to the tool's Related Guides. Worked-example schemas verified against actual tool output.
- **File:** `json-schema-multi-generator.html` + `js/json-schema-multi-generator-tool.js`
- **Keyword:** "generate json schema from multiple json", "json schema from examples", "merge json schemas online" — ~300–700/mo (very few tools do this; low competition)
- **Why:** Single-sample inference can't detect optional fields or nullable types. Multi-sample merging solves a real pain point for API teams with no clean web tool to do it. Reuses `inferSchema` logic already built; new `mergeSchemas()` function handles union of types and required-field intersection. Differentiator — quicktype only does it via CLI.
- **Algorithm:**
  - Parse each sample with existing `inferSchema()`
  - Fold schemas pairwise with `mergeSchemas(a, b)`: merges types to arrays, makes fields absent in any sample nullable, intersects `required` lists, recurses into nested objects and arrays
  - Simple/Smart Mode toggle (same as generator — localStorage `jsg_multi_smart_mode`)
- **UI:** Left panel = 2–5 textarea slots (Add/Remove Sample buttons); right panel = merged schema output + Copy button
- **Nav:** Add to "JSON Tools" dropdown as "Schema from Multiple JSON"
- **Companion blog post:** `blog/json-schema-from-multiple-samples.html` — targets "why json schema inference is wrong", "json schema optional fields", "nullable fields json schema"

#### T4 — String Escape / Unescape ✅ Done
- **File:** `string-escape.html`
- **Keyword:** "json string escape online", "escape special characters json", "unescape json string" — ~4k/mo
- **Built:** Pure JS inline IIFE (no CDN). Escape via `JSON.stringify().slice(1,-1)`; unescape via `JSON.parse` with quote-wrap + try/catch friendly error. Escape/Unescape/Copy/Clear buttons. GEO content: direct-answer block, escape-sequence table, when-to-escape list, worked example, escaping-vs-URL-encoding section. BreadcrumbList + WebApplication + FAQPage (6 Q&A synced to visible FAQ). RFC 8259 cited. Added to Encoders nav + sitemap; cross-linked from base64.html and url-encoder.html.
- **UI fix (2026-05-31):** Moved the inline info paragraph out of the `formatter-section` so it no longer sits inside the tool input area — now renders between the tool and the content sections below.
- **Blog post (2026-05-31):** `blog/json-string-escape.html` — supporting post; targets "json string escape online", "escape special characters json", "unescape json string"; HowTo (4 steps) + Article + BreadcrumbList + FAQPage (6 Q&A); escape sequence table, worked SQL example, JS/Python/Java code snippets, escaping-vs-URL-encoding comparison table, common mistakes section; cross-linked from string-escape.html; added to sitemap.

---

### Priority 2 — Medium Value

#### T5 — TOML to JSON
- **File:** `toml-to-json.html`
- **Keyword:** "toml to json converter", "toml to json online" — ~2k/mo
- **Why:** Growing Rust/cargo ecosystem; no clean online converter exists
- **Library:** `@iarna/toml` or `smol-toml` from CDN
- **What it does:** Parse TOML input, output formatted JSON
- **Nav:** Add to "Converters" dropdown

#### T6 — HTTP Status Codes Reference ✅ Done (2026-06-02)
- **Files:** `http-status.html` (hub) + `http-status/NNN.html` × 16 (200, 201, 204, 301, 302, 304, 400, 401, 403, 404, 418, 422, 429, 500, 502, 503)
- **Keyword:** "http status codes list", "what is 404", "500 status code", "401 vs 403", "429", "502 bad gateway", "how to fix [code]" — ~20k/mo total
- **Built:** JSON-API framed (every code has an example JSON error body + REST context). Hub = searchable/filterable table of all 1xx–5xx codes (inline IIFE filter, no library); 16 most-searched codes link to deep pages. Each deep page: Quick Answer box, meaning, common causes, example JSON error response, raw HTTP response, **"How to troubleshoot/handle HTTP NNN" checklist**, comparison blocks (401vs403, 301vs302, 400vs422, 500vs502vs503), FAQ. BreadcrumbList + Article + FAQPage on every page (built via JSON.stringify with `<`→`<` so a literal `</script>` can never leak). RFC 9110 cited; 418 per RFC 2324.
- **Nav:** New **"Other Tools"** dropdown (single link → hub; future home for T7/T9). Sitemap: hub 0.8 + 16 pages 0.6. Cross-linked from `blog/read-ugly-json-api-response.html` and `blog/api-returning-html-instead-of-json.html`.
- **Verified:** Playwright — nav + "Other Tools" render, hub filter narrows live, all 3 stylesheets load from `../`, breadcrumbs/checklists/FAQs present, no raw JSON-LD leak; all 17 files pass JSON-LD validity + FAQ-sync checks.

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
5. ✅ **T4** — String Escape/Unescape (`string-escape.html`) — complete
6. ✅ **Content enrichment** — Base64, UUID, JWT, Timestamp, Hash pages — complete
7. ✅ **GEO Cluster G1–G5** — G1 (is-it-safe-to-paste-json-online), G2 (is-it-safe-to-decode-jwt-online), G3 (read-ugly-json-api-response), G4 (json-to-yaml-kubernetes), G5 (privacy-first-json-tools) — all complete
8. ✅ **T6** — HTTP Status Codes (hub + 16 deep pages, JSON-API framed) — complete 2026-06-02
9. ✅ **T3b** — Schema from Multiple JSON Samples — complete 2026-06-05
10. ⬜ **T5, T7, T8** — TOML, Chmod, Markdown (in priority order)
