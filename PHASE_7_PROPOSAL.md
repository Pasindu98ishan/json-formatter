# Phase 7 — Reference-Cluster Expansion + Monetization Experiments

**Status**: In progress (implementation started 2026-06-10)
**Last Updated**: 2026-07-09

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
- [x] Schema: **BreadcrumbList + Article + FAQPage** (inline literal — the proven `http-status/` pattern). *Updated 2026-06-26: HowTo dropped — Google deprecated HowTo rich results, and it carried minor schema-mismatch risk. Recent pages now ship Breadcrumb + Article + FAQPage; legacy pages still carry HowTo (cleanup pending — see Cross-cutting work).*

**Template**: clone `http-status/404.html` (`data-root="../"`, `.quick-answer` box, `.code-block`/`.copy-code-btn`, FAQ `<details>`).
**Hub**: `errors.html` (root) — filterable index mirroring `http-status.html`; register in `js/navbar-component.js` + `json-tools.html` + `sitemap.xml`.

**Priority topics**: JSON parsing → network errors → CORS → Node/Python/JS runtime errors.

**Competitor landscape (shapes string selection).** Dedicated error-page libraries already exist — FixDevs, TrackJS, Rollbar, Sentry, bobbyhadz — and they **saturate the famous JS errors** ("Cannot read properties of undefined", Next.js hydration). Do **not** chase those head terms. Our edge is strings that are **(a) newer** (post-2023 tooling), **(b) JSON/API-adjacent** so they cross-link into our formatter/validator/LLM calc, or **(c) too niche** for the monitoring vendors to bother with. No fabricated source URLs in the brief — every candidate below carries a **verify query** (run it on Stack Overflow, sort by newest, confirm 2025–2026 activity before building).

#### Batch 1 — NEW `/errors/` pages (no existing post — build these, ship together)
- [x] `Bad control character in string literal in JSON`
- [x] `JSONDecodeError: Expecting value: line 1 column 1 (char 0)` (Python) → `errors/jsondecodeerror-expecting-value.html`
- [x] `Expecting property name enclosed in double quotes` (Python) → `errors/expecting-property-name-double-quotes.html`
- [x] `Extra data: line 1 column N (char N)` (Python) → `errors/jsondecodeerror-extra-data.html`
- [x] `CORS policy: No 'Access-Control-Allow-Origin' header` → `errors/cors-no-access-control-allow-origin.html`
- [x] `TypeError: Failed to fetch` → `errors/failed-to-fetch.html`
- [x] `net::ERR_CONNECTION_REFUSED`
- [x] `npm ERR! code ERESOLVE` → `errors/npm-eresolve-unable-to-resolve-dependency-tree.html`
- [x] `Error: Cannot find module` → `errors/cannot-find-module.html`
- [x] `EADDRINUSE: address already in use` → `errors/eaddrinuse-address-already-in-use.html`
- **Indexing leads (highest-volume gaps, ship first):** `Failed to fetch`, the CORS string, `JSONDecodeError: Expecting value`.

#### Batch 2 — net-new `/errors/` backlog (researched 2026-06-11; cross-checked against repo)
Same page contract as Batch 1 (clone `http-status/404.html`: exact string in H1 + body, quick-answer, code-that-throws, cause+fix, FAQ 1:1 with FAQPage, Breadcrumb + Article + FAQPage + HowTo). Ship in tier order — Tier A first because each cross-links an existing tool and reinforces internal PageRank.

**Tier A — JSON/API-adjacent (ship first; each cross-links a tool):**
- [x] `TypeError: Object of type datetime is not JSON serializable` (Python) → `errors/object-not-json-serializable.html` (covers datetime/Decimal/set/ndarray variants)
- [x] `json.decoder.JSONDecodeError: Unterminated string starting at` (Python) → `errors/jsondecodeerror-unterminated-string.html`
- [x] `JsonWebTokenError: invalid signature` / `jwt malformed` (Node) → `errors/jwt-invalid-signature-malformed.html` (cross-links `jwt-decoder.html` + `blog/is-it-safe-to-decode-jwt-online.html`)
- [~] `429 Too Many Requests` — retry/backoff (fetch/axios/Python) → **SKIPPED as duplicate-intent:** `http-status/429.html` already owns this (covers "Retrying a 429 the right way", rate-limit headers, the Python `requests` 429 error). Canonical rule forbids a competing `/errors/` page. Tie-in to LLM Cost Calculator can be a cross-link from the existing 429 page instead.
- [x] `process.env.X is undefined` (dotenv not loading; incl. Vite `import.meta.env`, Next `NEXT_PUBLIC_`) → `errors/process-env-undefined.html` (cross-links `blog/env-file-format.html`)
- [ ] **Optimize-in-place, NOT a new page:** add the verbatim modern V8 string `Unexpected token '<', "<!DOCTYPE"... is not valid JSON` to existing `blog/json-unexpected-token.html`. *Verify:* SO `Unexpected token DOCTYPE is not valid JSON`

**Tier B — Node/JS module + build (high volume, broad):**
- [x] `SyntaxError: Cannot use import statement outside a module` → `errors/cannot-use-import-statement-outside-a-module.html` (paired + cross-linked with the next item)
- [x] `ReferenceError: require is not defined in ES module scope` → `errors/require-is-not-defined-es-module-scope.html` (mirror of the above; pair cross-linked)
- [x] `FATAL ERROR: Reached heap limit — JavaScript heap out of memory` → `errors/javascript-heap-out-of-memory.html`
- [x] `Error: error:0308010C:digital envelope routines::unsupported` (Node 17+ OpenSSL vs old webpack) → `errors/digital-envelope-routines-unsupported.html` (cross-links Hash Generator)
- [x] `ECONNRESET` / `socket hang up` (Node) → `errors/econnreset-socket-hang-up.html` (built 2026-07-01; **new fix-first playbook structure** — fastest-fix card, 30-sec triage, ranked fixes, why-after, verify box; cross-links ERR_CONNECTION_REFUSED)
- [x] `npm ERR! code EACCES: permission denied` → `errors/npm-eacces-permission-denied.html` (built 2026-07-01; no-sudo fix, nvm/prefix/chown, by-platform table)
- [x] `gyp ERR! build error` → `errors/gyp-err-build-error.html` (built 2026-07-01; toolchain per OS, Python, ABI rebuild, prebuilt binaries)
- [x] `Module not found: Can't resolve 'fs'` → `errors/module-not-found-cant-resolve-fs.html` (built 2026-07-01; Next.js/webpack/Vite server-client boundary, import-trace reading)
- [x] `504 (Outdated Optimize Dep)` (Vite) → `errors/vite-504-outdated-optimize-dep.html` (built 2026-07-01; optimize cache clear, optimizeDeps.include, dev-only)

**Tier C — Python runtime (evergreen; competition is only old SO threads):**
- [x] `error: externally-managed-environment` (pip / PEP 668, 2023+) → `errors/externally-managed-environment.html` (built 2026-07-01; venv/pipx/distro fixes, "what NOT to do" break-system-packages, decision table)
- [x] `TypeError: 'NoneType' object is not subscriptable` → `errors/nonetype-not-subscriptable.html` (built 2026-07-01; → JSON Formatter; 30-sec diagnose, cross-links `nonetype-no-attribute`)
- [x] `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff` (CSV/file-reading) → `errors/unicodedecodeerror-utf-8-codec.html` (cross-links CSV→JSON + Base64)
- [x] `ssl.SSLCertVerificationError: certificate verify failed` → `errors/ssl-certificate-verify-failed-python.html` (built 2026-07-01; certifi/macOS certs, corporate-proxy CA, missing intermediate; never verify=False)

#### Batch 3 — JSON/encoding moat expansion (built 2026-06-25 → 06-26; from `json-error-cluster-briefs.md`)
Net-new `/errors/` pages that thicken the JSON serialize/parse + encoding sub-cluster the domain has the strongest claim to. Each ships the page contract **plus** the VS Code code-highlighting beta, and each links a **distinct tool beyond Formatter/Validator** (the standing "link a new tool" rule).

**JSON serialization / parse (the moat):**
- [x] `JSON.stringify drops a property` (undefined / function / symbol; array→null vs object→omit asymmetry; Map/Set→{}; replacer-array) → `errors/json-stringify-missing-property.html` (→ JSON Diff)
- [x] `TypeError: Do not know how to serialize a BigInt` → `errors/bigint-not-serializable.html` (→ JSON to TypeScript; mirrors the Python serialization page)
- [x] `SyntaxError: Unexpected non-whitespace character after JSON data` → `errors/unexpected-non-whitespace-after-json.html` (JS mirror of Python `Extra data`; NDJSON streaming section)

**Network / fetch (thin category, shored up):**
- [x] `TypeError: Failed to execute 'json' on 'Response': body stream already read` → `errors/response-body-already-read.html`
- [x] `AbortError: The operation was aborted` → `errors/aborterror-operation-aborted.html` (axios CanceledError, AbortSignal.any, React cleanup)
- [x] `net::ERR_NAME_NOT_RESOLVED` → `errors/err-name-not-resolved.html` (+ Node `getaddrinfo ENOTFOUND`)

**Encoding / runtime (each maps to an encoder/generator tool):**
- [x] `Failed to execute 'atob': The string to be decoded is not correctly encoded` → `errors/atob-string-not-correctly-encoded.html` (→ Base64 + JWT Decoder)
- [x] `URIError: URI malformed` (decodeURIComponent) → `errors/urierror-uri-malformed.html` (→ URL Encoder)

> **Optimize-in-place (done):** `object-not-json-serializable.html` extended for the verbatim `Decimal`/`set` strings + the `default=str` global-catch-all caution, instead of building competing pages (canonical rule).

#### Cross-cutting work shipped alongside Batch 3
- **VS Code syntax highlighting (BETA)** — dependency-free, privacy-first highlighter (`css/code-highlight.css` + `js/code-highlight.js`) on the 10 newest `/errors/` pages. Tokenizes on decoded `textContent` and re-escapes output (no markup injection); Copy button unaffected. Rollout to the rest of `/errors/` + `/blog/` is a 2-line include per page when ready.
- **HowTo schema removed** from the 10 newest pages (Breadcrumb + Article + FAQPage only). **Pending:** strip HowTo from the 15 older `/errors/` pages.
- **`errors.html` hub upgrades** — visible "N errors documented" count, category jump-nav chips (JSON / Network / Node.js / Python / **Runtime**) filtering by the row's category tag, and all Batch 3 pages registered in the table + `sitemap.xml`.
- **`errors.html` upgraded to an SEO pillar page (done 2026-06-26)** — keyword-rich H1 + intro ("JavaScript, Python & JSON errors"), **6 static crawlable `<h2>` category sections** below the table (JSON Parse & Serialization, Python, Encoding & Base64, URI & URL, Node.js & Build, Network & Fetch) with real `<a>` anchors to all 38 pages (crawl signal independent of the JS-filtered table, which is unchanged), **CollectionPage JSON-LD** added (now Breadcrumb + CollectionPage + FAQPage, no HowTo), and a 5-tool Related block (Formatter, Validator, JSON Diff, Base64, URL Encoder). Validated: 1 H1, 6 H2, 38 anchors, 0 broken links.
- **Tool ↔ error reverse linking** — "Related Errors" sections added to `formatter.html`, `json-validator.html`, `json-to-typescript.html`, `json-diff.html`; error pages link the relevant tool inline + in a "Related Tools" block.
- **Pending cluster cleanup:** trim/remove the keyword-stuffy `meta name="keywords"` across the cluster (started on `unicodedecodeerror-utf-8-codec.html`).

#### Batch 4 — multi-language + DB/Docker expansion (proposed 2026-06-26; dedup-checked against the 38 live pages)
Extends the cluster beyond JS/Python/JSON into the TypeScript compiler-error layer, more Python runtime errors, Go/Rust/Java flagships, and the high-ROI DB/SQL + Docker space. Same page contract as Batch 3: exact string in H1 + body, quick-answer, code-that-throws, cause+fix, FAQ 1:1 with FAQPage, **Breadcrumb + Article + FAQPage** (no HowTo), VS Code highlighting, and a tool cross-link where one fits.

> **Dedup notes:** `requests.exceptions.JSONDecodeError: Expecting value` was proposed but is **already owned** by `errors/jsondecodeerror-expecting-value.html` (it covers the `requests`/`response.json()` variant) — **not built, canonical rule.** `TypeError: 'NoneType' object is not subscriptable` is **already the Tier C entry above** — not duplicated here.

**Tier 1 — TypeScript compiler errors (verbatim TSxxxx codes; cross-link JSON → TypeScript):**
- [x] `Type 'X' is not assignable to type 'Y'` (TS2322) → `ts2322-type-not-assignable.html` (built 2026-06-27; → JSON to TypeScript)
- [x] `Property 'X' does not exist on type 'Y'` (TS2339) → `ts2339-property-does-not-exist.html` (built 2026-06-27)
- [x] `Object is possibly 'undefined'` (TS2532) → `ts2532-object-possibly-undefined.html` (built 2026-06-27)
- [x] `Argument of type 'X' is not assignable to parameter of type 'Y'` (TS2345) → `ts2345-argument-not-assignable.html` (built 2026-06-27)
- [x] `Could not find a declaration file for module 'X'` (TS7016) → `ts7016-could-not-find-declaration-file.html` (built 2026-06-27)
- [x] `Element implicitly has an 'any' type … can't be used to index` (TS7053) → `ts7053-element-implicitly-any-index.html` (built 2026-06-27)
- [x] `This expression is not callable` (TS2349) → `ts2349-expression-not-callable.html` (built 2026-06-27)

**Tier 2 — Python runtime (strongest adjacency; #string-indices / #json-object pull into Formatter/Validator):**
- [x] `TypeError: string indices must be integers` → `string-indices-must-be-integers.html` (built 2026-06-27; → JSON Formatter / CSV→JSON; reviewed: 30-sec diagnose, framework contexts, version box)
- [x] `TypeError: the JSON object must be str, bytes or bytearray, not dict` → `json-object-must-be-str-bytes.html` (built 2026-06-27; → JSON Formatter / Minifier)
- [x] `KeyError: 'X'` (dict access) → `keyerror-python.html` (built 2026-06-27; → JSON Formatter / JSONPath / HTTP status)
- [x] `AttributeError: 'NoneType' object has no attribute 'X'` → `nonetype-no-attribute.html` (built 2026-07-01; → JSON Formatter; 30-sec diagnose, missing-return/None-API/in-place-method causes)
- [x] `IndentationError: unexpected indent` → `indentationerror-unexpected-indent.html` (built 2026-07-01; tabs vs spaces, TabError note, `python -tt`)
- [x] `ValueError: Trailing data` (json / `pandas.read_json`) → `valueerror-trailing-data.html` (built 2026-06-27; SVG diagram, cross-links `jsondecodeerror-extra-data.html`)

**Tier 3 — JS/Node runtime:**
- [x] `TypeError: Cannot read properties of null (reading 'X')` → `cannot-read-properties-of-null.html` (built 2026-06-27; covers null + undefined, DOM, async; links TS2532)
- [x] `UnhandledPromiseRejectionWarning` / `unhandledRejection` (modern Node crashes on it) → `unhandled-promise-rejection.html` (built 2026-06-27)
- [x] `RangeError: Maximum call stack size exceeded` → `maximum-call-stack-size-exceeded.html` (built 2026-06-27; → JSON Formatter/Diff; circular-reference adjacent)

> **Batch 4 progress (2026-06-27, cont.):** Tier 1 TypeScript (7) + Tier 3 JS/Node runtime (3) built. New hub category **TypeScript** added (chip + tag), plus a **JavaScript Runtime Errors** static section. Hub now ~58 errors. Remaining Batch 4: Tier 4 Go/Rust/Java flagships, and the 2 Python runtime entries (`nonetype-no-attribute`, `indentationerror-unexpected-indent`).

**Tier 4 — Go / Rust / Java (new territory; selective flagships):**
- [x] `json: cannot unmarshal string into Go value of type X` → `go-json-cannot-unmarshal.html` (built 2026-06-27; → JSON tools + JSON→TS; deepest page: value×field table, nullable, interface{} map, DisallowUnknownFields)
- [x] `panic: runtime error: invalid memory address or nil pointer dereference` → `go-nil-pointer-dereference.html` (built 2026-07-01; SIGSEGV stack, typed-nil interface trap, nil-map write)
- [x] `panic: runtime error: index out of range [N] with length M` → `go-index-out-of-range.html` (built 2026-07-01; N vs M read, append vs make, external-data length)
- [x] `fatal error: all goroutines are asleep - deadlock!` → `go-all-goroutines-asleep-deadlock.html` (built 2026-07-01; per-goroutine block tags, unbuffered chan/WaitGroup/range, SIGQUIT)
- [x] `error[E0382]: borrow of moved value` (Rust) → `rust-borrow-of-moved-value-e0382.html` (built 2026-07-01; move vs borrow, Copy/clone, loop/closure moves)
- [x] `cannot borrow X as mutable more than once at a time` (Rust E0499) → `rust-cannot-borrow-as-mutable-e0499.html` (built 2026-07-01; NLL last-use, split_at_mut, RefCell, E0499 vs E0502)
- [x] `Exception in thread "main" java.lang.NullPointerException` (+ Java 14+ helpful-NPE `Cannot invoke "X" because "Y" is null`) → `java-nullpointerexception.html` (built 2026-07-01; helpful-NPE message anatomy, Map.get/unboxing/uninit-field)

**Tier 5 — DB/SQL + Postgres + Docker (highest traffic-to-competition ratio; off-moat but strong impressions):**
- [x] `FATAL: sorry, too many clients already` / `remaining connection slots are reserved` (Postgres) → `postgres-too-many-clients.html` (built 2026-06-27)
- [x] `ERROR: deadlock detected` (Postgres) → `postgres-deadlock-detected.html` (built 2026-06-27)
- [x] `duplicate key value violates unique constraint` (Postgres) → `postgres-duplicate-key-unique-constraint.html` (built 2026-06-27)
- [x] `docker: Error response from daemon: … port is already allocated` → `docker-port-is-already-allocated.html` (built 2026-06-27; cross-links `eaddrinuse-address-already-in-use.html`)
- [x] `standard_init_linux.go: … exec format error` (Docker, ARM/M1 ↔ x86 image mismatch) → `docker-exec-format-error.html` (built 2026-06-27)

> **Batch 4 progress (2026-06-27):** Tier 2 JSON-mishandling + Tier 4 Go unmarshal (5 pages) and the full Tier 5 DB/SQL + Docker cluster (5 pages) are **built**. New hub categories added for the DB/Docker cluster: **Database** and **Docker**. Remaining: Tier 1 TypeScript codes, Tier 3 JS/Node runtime, Tier 4 Rust/Java, and the two skipped Python runtime entries (`nonetype-no-attribute`, `indentationerror-unexpected-indent`).

> **Batch 4 progress (2026-07-01) — Batch 4 COMPLETE:** Built the final 10 pages — Tier 4 Go (nil pointer, index out of range, goroutine deadlock), Rust (E0382 moved value, E0499 mutable borrow), Java (NullPointerException), plus the remaining Python runtime entries (`nonetype-no-attribute`, `nonetype-not-subscriptable`, `indentationerror-unexpected-indent`) and the pip `externally-managed-environment` opportunity page. New hub category **Go / Rust / Java** added (chip + `.err-lang` tag + 6 table rows + static `#lang-errors` section); 4 Python rows added to the existing Python category; CollectionPage ItemList extended to 11 categories. All 10 registered in `sitemap.xml` (lastmod 2026-07-01). Every Batch 4 tier is now `[x]`.

#### Batch 5 — authority build: every subcategory to ≥15 pages (proposed 2026-07-05; full plan in `.claude/plans/golden-inventing-wind.md`)
**Goal:** the cluster is 74 pages but lopsided — JSON 16 / Python 15 / Node 15 are deep, six categories are thin. Bring **every** subcategory to **≥15** so each reads as an authoritative mini-hub. **62 net-new pages**, all deduped against the current 74. **No new subcategories** (all map to existing hub tags). **No new tools** (a DB Connection String Parser was considered and declined to keep scope on the pages).
**Template:** best-fit per page and **deliberately mixed** within each category (~70/30, never monolithic — avoids a programmatic footprint). Fix-first playbook (`econnreset`, `gyp-err` refs) for ops/config; diagnosis page (`go-nil-pointer`, `ts2322` refs) for semantic/type. Keep the standing plumbing: exact string in H1+body, **Breadcrumb + Article + FAQPage** (no HowTo), FAQ↔FAQPage 1:1, VS Code highlighting.
**Linking (HARD):** every `.tool-cta` = **All Error References** + a **relevant tool** + **HTTP Status Codes** (`../http-status.html`), plus a deep `../http-status/<code>.html` link (403/429/500/502/503) when a code is directly implicated. Docker/DB lean on the HTTP-status reference as their primary tie-in (no strong JSON-tool fit).
**Build order — highest-traffic first (~7 batches of 8–10):** (1) JS Runtime family → (2) rest of Runtime + Network → (3) Network + Database → (4) Database + Docker → (5) Docker → (6) Docker + TypeScript → (7) Go/Rust/Java.

> **Batch 1 progress (2026-07-05):** Built the first 10 pages — Tier R items 1–10 (Cannot read properties of undefined, X is not a function, X is not defined, Assignment to constant variable, TDZ, Cannot set properties of undefined, Cannot convert undefined or null to object, X.map is not a function, Failed to construct URL, Invalid array length). Mixed template on purpose: 8 diagnosis-style + 2 fix-first playbooks (`cannot-convert-undefined-or-null-to-object`, `x-map-is-not-a-function`). All 10 registered in the `err-runtime` table rows + `#js-runtime-errors` static section + `sitemap.xml` (lastmod 2026-07-05). Runtime category now **14/15** — 1 item (`process is not defined`) deliberately deferred to merge with the Network batch per the build order. No new subcategories, no new tools; every page's `.tool-cta` links Errors hub + a relevant tool + HTTP Status Codes.

> **Batch progress (2026-07-13):** Built 3 pages — Tier TS (`TS2307: Cannot find module`) and 2 from Tier DK (`Cannot connect to the Docker daemon`, `Container exited with code 137 / OOMKilled`). All 3 exceed the 1300-word bar (1594–1999 words). Registered in `errors.html` (table rows + `#docker-errors`/`#typescript-errors` static sections), `sitemap.xml` (lastmod 2026-07-13), and `data/error-signatures.json` (HARD rule — signature count now tracks the `errors/*.html` count 1:1 at 95). Reciprocal links added from `ts7016-could-not-find-declaration-file.html` and the 2 existing Docker pages back to the new ones. Docker is now 4/15, TypeScript is now 8/15.

> **Batch 2 progress (2026-07-05):** Built the next 10 pages — the deferred Tier R item (`process is not defined`) plus all 9 Tier N Network items. New word-count bar applied to this batch: every page exceeds 1300 words (range 1577–2139, verified via script), written with senior-engineer depth — deeper mechanism sections (webpack polyfill history, TLS trust-chain walk, TCP handshake/backlog internals, OS connectivity-state heuristics, CORS preflight semantics), more causes per page, richer comparison tables, and FAQs expanded to 6–7. Template mix: 6 fix-first playbooks (`referenceerror-process-is-not-defined`, `net-err-cert-authority-invalid`, `net-err-ssl-protocol-error`, `net-err-too-many-redirects`, `net-err-connection-timed-out`, `net-err-internet-disconnected`, `net-err-blocked-by-client` — 7 total) + 3 diagnosis pages (`cors-preflight-does-not-pass-access-control-check`, `cors-request-header-not-allowed-preflight`, `mixed-content-insecure-resource-blocked`). All 10 registered in `err-runtime`/`err-network` table rows + `#js-runtime-errors`/`#network-errors` static sections + `sitemap.xml` (lastmod 2026-07-05). **Runtime is now 15/15, Network is now 15/15.** No new subcategories, no new tools; every page's `.tool-cta` links Errors hub + a relevant tool + HTTP Status Codes.

**Tier R — JS Runtime (`err-runtime`, 4→15, +11):**
- [x] `TypeError: Cannot read properties of undefined (reading 'X')` → `errors/cannot-read-properties-of-undefined.html` (built 2026-07-05; diagnosis; the *undefined* sibling of the existing *null* page, reciprocal link added to both)
- [x] `Uncaught TypeError: X is not a function` → `errors/uncaught-typeerror-x-is-not-a-function.html` (built 2026-07-05; diagnosis; import/typo/shadowing causes)
- [x] `Uncaught ReferenceError: X is not defined` → `errors/uncaught-referenceerror-x-is-not-defined.html` (built 2026-07-05; diagnosis; script-order, Node-globals-in-browser, module scope)
- [x] `TypeError: Assignment to constant variable` → `errors/assignment-to-constant-variable.html` (built 2026-07-05; diagnosis; reassignment vs mutation)
- [x] `ReferenceError: Cannot access 'X' before initialization` (TDZ) → `errors/cannot-access-before-initialization-tdz.html` (built 2026-07-05; diagnosis; temporal dead zone explained)
- [x] `TypeError: Cannot set properties of undefined (setting 'X')` → `errors/cannot-set-properties-of-undefined.html` (built 2026-07-05; diagnosis; write-side sibling of the read errors)
- [x] `TypeError: Cannot convert undefined or null to object` → `errors/cannot-convert-undefined-or-null-to-object.html` (built 2026-07-05; **fix-first playbook**; Object.keys/values/entries/assign)
- [x] `TypeError: X.map is not a function` → `errors/x-map-is-not-a-function.html` (built 2026-07-05; **fix-first playbook**; paginated/envelope API responses, Array.isArray guard)
- [x] `TypeError: Failed to construct 'URL': Invalid URL` → `errors/failed-to-construct-url-invalid-url.html` (built 2026-07-05; diagnosis; → URL Encoder tool)
- [x] `RangeError: Invalid array length` → `errors/rangeerror-invalid-array-length.html` (built 2026-07-05; diagnosis)
- [x] `ReferenceError: process is not defined` → `errors/referenceerror-process-is-not-defined.html` (built 2026-07-05; **fix-first playbook**; Vite/webpack/CRA env-var shimming, webpack 4→5 polyfill-removal history; 1914 words)

**Tier N — Network (`err-network`, 6→15, +9):**
- [x] `net::ERR_CERT_AUTHORITY_INVALID` (+ `CERT_COMMON_NAME_INVALID` variant) → `errors/net-err-cert-authority-invalid.html` (built 2026-07-05; **fix-first playbook**; mkcert, corporate TLS-inspecting proxies, missing intermediate cert, TLS trust-chain mechanism)
- [x] `net::ERR_SSL_PROTOCOL_ERROR` → `errors/net-err-ssl-protocol-error.html` (built 2026-07-05; **fix-first playbook**; HTTP/HTTPS port confusion, wrong server constructor, legacy TLS versions; 1899 words)
- [x] `net::ERR_TOO_MANY_REDIRECTS` → `errors/net-err-too-many-redirects.html` (built 2026-07-05; **fix-first playbook**; Cloudflare Flexible-SSL loop, cookie-state loop, auth middleware self-redirect, WordPress siteurl mismatch)
- [x] `net::ERR_CONNECTION_TIMED_OUT` → `errors/net-err-connection-timed-out.html` (built 2026-07-05; **fix-first playbook**; security-group silent drop, stale DNS, accept-queue overload, dead keep-alive)
- [x] `net::ERR_INTERNET_DISCONNECTED` → `errors/net-err-internet-disconnected.html` (built 2026-07-05; **fix-first playbook**; stale OS connectivity cache, captive portal, VPN routing table, IPv6-not-routed)
- [x] `net::ERR_BLOCKED_BY_CLIENT` (ad blocker) → `errors/net-err-blocked-by-client.html` (built 2026-07-05; **fix-first playbook**; filter-list false positives, extension isolation, corporate content filters, endpoint renaming)
- [x] `Response to preflight request doesn't pass access control check` (CORS preflight) → `errors/cors-preflight-does-not-pass-access-control-check.html` (built 2026-07-05; diagnosis; missing OPTIONS handler, incomplete allow headers, wildcard+credentials, proxy stripping)
- [x] `Request header field X is not allowed by Access-Control-Allow-Headers in preflight` → `errors/cors-request-header-not-allowed-preflight.html` (built 2026-07-05; diagnosis; missing allow-list entry, config drift, credentialed wildcard limits, conditional headers)
- [x] `Mixed Content: … requested an insecure resource` (blocked) → `errors/mixed-content-insecure-resource-blocked.html` (built 2026-07-05; diagnosis; hardcoded HTTP URLs, stale CMS content, third-party embeds, CSP upgrade-insecure-requests)

**Tier DB — Database (`err-db`, 3→15, +12; spread Postgres/MySQL/Mongo):**
- [x] PG `relation "X" does not exist` — built 2026-08-26, diagnosis style with a 3-step triage SVG. Covers identifier case folding, search_path/`current_schemas(true)`, wrong database, migration bookkeeping tables, non-table relations (sequence/view/matview), temp tables under pooling, and the schema-`USAGE` case that produces this message instead of "permission denied". All error strings verified against PostgreSQL 16.15 in a container. ~1,900 words.
- [ ] PG `column "X" does not exist`
- [ ] PG `password authentication failed for user "X"`
- [ ] PG `syntax error at or near "X"`
- [ ] PG `null value in column "X" violates not-null constraint`
- [ ] PG `current transaction is aborted, commands ignored until end of transaction block`
- [ ] MySQL `ERROR 1045 (28000): Access denied for user`
- [ ] MySQL `ERROR 1062 (23000): Duplicate entry 'X' for key`
- [ ] MySQL `ERROR 1146: Table 'X' doesn't exist`
- [ ] MySQL `ERROR 2002 (HY000): Can't connect to local MySQL server through socket`
- [x] MongoDB `E11000 duplicate key error collection` → `mongodb-e11000-duplicate-key-error.html` (built 2026-08-01; **fix-first playbook**; fastest-fix upsert card, 30-sec triage table, `updateOne`/`findOneAndUpdate` upsert, catch `err.code === 11000`/`keyValue` → 409, the `{ field: null }` missing-field trap → partial index, stale-index inspect/drop `getIndexes`/`dropIndex`, compound-index tuple, Mongoose `unique:true` is an index not a validator; cross-links `postgres-duplicate-key-unique-constraint.html` both ways; ~1650 words)
- [ ] Mongo `MongooseServerSelectionError` / `connect ECONNREFUSED`

**Tier DK — Docker (`err-docker`, 2→15, +13):**
- [x] `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?` → `errors/docker-cannot-connect-to-daemon.html` (built 2026-07-13; diagnosis; daemon-not-started, wrong/stale context, stale DOCKER_HOST, WSL2 integration, permission-denied lookalike, CI DooD/DinD; 1594 words)
- [x] `Container exited with code 137` (OOMKilled) → `errors/docker-container-exited-code-137-oomkilled.html` (built 2026-07-13; diagnosis; OOMKilled flag confirmation via `docker inspect`, container-vs-host scope, Java/Node heap sizing inside a cgroup limit, real-leak vs needs-more-memory, Kubernetes OOMKilled vs Evicted, non-memory 137 causes; 1641 words)
- [x] `pull access denied for X, repository does not exist or may require 'docker login'` → `errors/docker-pull-access-denied.html` (built 2026-08-11; diagnosis + **SVG 4-branch decision tree**; leads on *why* the message is ambiguous — the registry returns an identical denial for a missing repo and a private one so private names can't be probed, which is a privacy guarantee rather than a vague error; causes: unqualified name silently expanding to `docker.io/library/<name>` (the official-images namespace), typo in name/tag, per-host credentials (a Hub login does nothing for `ghcr.io`) with a 5-registry login table incl. ECR/Artifact Registry, authenticated-but-unauthorized (token scopes, org membership, cloud IAM as a second gate), and CI-has-no-credentials; `docker logout` + re-pull as the public/private test; BuildKit + Compose message variants; 5-way lookalike table vs `manifest not found`, push-side `denied`, `unauthorized`, and `toomanyrequests`; ~1900 words)
- [x] `no space left on device` → `errors/docker-no-space-left-on-device.html` (built 2026-07-14; **fix-first**, SVG where-did-space-go diagram; `docker system df` → prune ladder; `--volumes` data-loss warning, Docker Desktop VM disk, inode exhaustion; 1333 words)
- [x] `OCI runtime create failed: … executable file not found in $PATH` → `errors/docker-oci-runtime-exec-not-found.html` (built 2026-07-19; diagnosis + SVG decision-tree diagram — shell fails vs shell opens+which fails vs file exists but won't run vs CRLF; typo, not-installed, exec-vs-shell-form CMD, distroless/scratch, chmod +x / COPY --chmod, CRLF/dos2unix; comparison table vs `docker-exec-format-error.html`; ~1613 words)
- [x] `Conflict. The container name "/X" is already in use` → `errors/docker-container-name-already-in-use.html` (built 2026-07-19; **fix-first playbook**; 30-second disposable/wanted/running triage, `docker rm -f`, `docker start` reuse, `docker rename`, `--rm`, idempotent CI pattern, Compose `container_name`/`down` vs `stop`; ~1747 words)
- [ ] `manifest for X not found` / `manifest unknown`
- [ ] `denied: requested access to the resource is denied` (push)
- [x] ~~`Container exited with code 137` (OOMKilled)~~ — **stale duplicate entry, corrected 2026-08-12.** This intent was already built above as `errors/docker-container-exited-code-137-oomkilled.html` (2026-07-13); the line was accidentally listed twice in the original Tier DK backlog. Left in place struck through so the count reconciles — do **not** build a second page for it (canonical one-page-per-intent rule).
- [x] `Got permission denied while trying to connect to the Docker daemon socket` → `errors/docker-permission-denied-daemon-socket.html` (built 2026-07-14; diagnosis; docker-group fix vs sudo, new-session requirement, root-equivalent security note, rootless Docker; cross-linked with `docker-cannot-connect-to-daemon.html` as the lookalike; 1331 words)
- [x] `failed to compute cache key: … not found` (COPY path) → `errors/docker-failed-to-compute-cache-key.html` (built 2026-08-12; diagnosis + **SVG build-context boundary diagram**; leads on the point that the message names the *step* that failed (hashing for layer reuse) rather than the *reason*, and that the legacy non-BuildKit wording — `file not found in build context or excluded by .dockerignore` — is the better mental model because it names both causes at once; one core concept — `COPY` resolves from the **context root**, never the Dockerfile's directory, and `-f` only chooses which file to read; 5 causes — Dockerfile in a subdirectory (plus the mirror-image shrunk-context mistake), `.dockerignore` exclusion (with allowlist `*` + `!` patterns called out as the sneaky form, and a runnable `COPY . /ctx` + `find` recipe to list what the builder actually received), `..` escaping the context (widen it, with the upload-cost caveat), uncommitted/generated files in CI (`git ls-files --error-unmatch`), and `COPY --from` resolving inside the *stage* (`--target` + `ls` to inspect); 7-row triage table; ~2350 words. **Revised same day after review:** trimmed the build-context concept from four full restatements to one (kept the Quick-answer and FAQ echoes deliberately, for skimmers and rich results); added a **Docker Compose** section showing `build.context` — not `dockerfile:` — sets the `COPY` root, and that `context:` is itself relative to the Compose file's location; noted everything applies to **`ADD`** as well; added **filename case-sensitivity** as a third CI-only flavour, called out specifically because it slips past the `git ls-files` check (the file *is* tracked — the name is what's wrong); demoted the busybox context-listing trick behind three cheap first checks and labelled it "Advanced"; **removed an overclaim** that `**/node_modules` and `*.json` "catch people the same way" — `.dockerignore` matching has real anchoring/directory/re-inclusion subtleties that sentence flattened, so the unambiguous `*` + `!` allowlist example now stands alone; hedged "you can't copy from a stage declared below" to *typically*, since BuildKit resolves some forward references; shortened the visible `<h1>` while keeping the full error string in `<title>`, meta, JSON-LD, the verbatim code block, and now the opening paragraph)
- [ ] `driver failed programming external connectivity on endpoint`
- [ ] `unauthorized: incorrect username or password` (docker login)
- [ ] `dockerfile parse error` / `unknown instruction`

**Tier TS — TypeScript (`err-ts`, 7→15, +8; → JSON-to-TS tool):**
- [x] `TS2307: Cannot find module 'X' or its corresponding type declarations` → `errors/ts2307-cannot-find-module-or-type-declarations.html` (built 2026-07-13; diagnosis; missing install, missing @types/ambient declaration, wrong/case-mismatched path, unmirrored alias, moduleResolution vs package exports map, non-JS asset imports, monorepo build-order worked example; distinguished from TS7016; 1999 words)
- [x] `TS2304: Cannot find name 'X'` → `errors/ts2304-cannot-find-name.html` (built 2026-07-14; diagnosis; missing import, Node globals/@types/node, DOM lib, typo/TS2552, test-runner globals; 1446 words)
- [x] `TS7006: Parameter 'x' implicitly has an 'any' type` → `errors/ts7006-parameter-implicitly-has-an-any-type.html` (built 2026-07-14; diagnosis; noImplicitAny, annotate vs type-the-source, JSON.parse→any cascade → JSON-to-TS tie-in, event handlers, destructuring/TS7031, don't-disable-the-flag; 1366 words)
- [x] `TS2769: No overload matches this call` → `errors/ts2769-no-overload-matches-this-call.html` (built 2026-07-14; diagnosis + SVG overload-resolution flow; read the per-overload sub-error, narrow union args, options-object property, arg count; distinguished from TS2345; 1397 words)
- [x] `TS2739: Type 'X' is missing the following properties from type 'Y'` → `errors/ts2739-type-missing-properties.html` (built 2026-08-12; diagnosis; leads on the **TS2739-vs-TS2741 split** — same structural check, singular vs plural count, identical fixes; 4 fixes — supply the fields, mark `?` optional (with the "you now own `| undefined` at every read site" trade spelled out), model partial data with `Partial<T>`/`Pick<T,…>` for drafts/patches/subset params, or fix the wrong object (API envelope `body.data`, snake_case DTO mapping); a dedicated "why `as` is the wrong tool" section showing the assertion converting a compile error into a runtime `undefined`; 4-way assignability table vs TS2322/TS2345/TS2339 with the absent-in-what-you-supply vs absent-in-what-you-read distinction; → JSON to TypeScript; ~1750 words)
- [x] `TS2366: Function lacks ending return statement and return type does not include 'undefined'` → `errors/ts2366-function-lacks-ending-return.html` (built 2026-08-12; diagnosis; reads the message as **two clauses** — fall-through path *and* a return type that can't hold `undefined` — since fixing either clears it; why it only appears under `strictNullChecks` and that enabling the flag revealed rather than created the gap; 4 fixes — final `return`, symmetric `if/else` (incl. the zero-iteration loop path), `throw` for should-never-happen branches, and an exhaustive `switch` over a literal union with a `const _: never` guard that breaks the build when a union member is added; a "be careful with this one" section on widening to `| undefined` (honest for a real not-found, hole-relocating for `grade()`); TS2366 vs `noImplicitReturns` table noting the latter is **not** part of `strict`; ~1900 words)
- [x] `TS18048: 'X' is possibly 'undefined'` → `ts18048-value-possibly-undefined.html` (built 2026-08-01; diagnosis; source triage (optional prop / `find` / `Map.get` / `noUncheckedIndexedAccess` / env var), guard, `?? / ?.`, default-at-source, non-null `!` caveat; distinguished from TS2532 + null siblings TS18047/TS2531; → JSON to TypeScript; ~1500 words)
- [x] `TS2571: Object is of type 'unknown'` → `ts2571-object-is-of-type-unknown.html` (built 2026-08-01; diagnosis; caught-error `instanceof` narrowing, type predicates, `asserts v is T` / Zod validation for JSON, specific-assertion-not-`any`; covers sibling TS18046; → JSON to TypeScript; ~1550 words)

**Tier L — Go/Rust/Java (`err-lang`, 6→15→30, +9 then +15; 3→5→10 per language):**
- [x] Go `undefined: X` (compile) → `errors/go-undefined-x.html` (built 2026-07-09; diagnosis; typo/missing import/unexported identifier/build-tag exclusion)
- [x] Go `imported and not used: "X"` → `errors/go-imported-and-not-used.html` (built 2026-07-09; diagnosis; blank-identifier side-effect imports, goimports)
- [x] Go `cannot find module providing package X` → `errors/go-cannot-find-module-providing-package.html` (built 2026-07-09; diagnosis + SVG module-resolution-walk diagram; go.mod → cache → network)
- [x] Rust `error[E0308]: mismatched types` → `errors/rust-e0308-mismatched-types.html` (built 2026-07-09; diagnosis; integer coercion, &T vs T, Option/Result, String vs &str, if/match branches)
- [x] Rust `error[E0277]: the trait bound 'X' is not satisfied` → `errors/rust-e0277-trait-bound-not-satisfied.html` (built 2026-07-09; diagnosis; nominal vs structural typing, #[derive], operator traits)
- [x] Rust `error[E0597]: 'X' does not live long enough` → `errors/rust-e0597-does-not-live-long-enough.html` (built 2026-07-09; diagnosis + SVG scope-vs-lifetime diagram)
- [x] Java `Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException` → `errors/java-arrayindexoutofboundsexception.html` (built 2026-07-09; diagnosis; off-by-one loop bounds, stale cached index after resize)
- [x] Java `java.lang.ClassNotFoundException` / `NoClassDefFoundError` → `errors/java-classnotfoundexception-noclassdeffounderror.html` (built 2026-07-09; diagnosis + SVG two-phase classloading diagram; explicit vs implicit load)
- [x] Java `error: cannot find symbol` (javac) → `errors/java-cannot-find-symbol.html` (built 2026-07-09; diagnosis; symbol/location pair, scope, overload resolution, missing import)

> **Tier L extension (planned 2026-07-14, full brief in `.claude/plans/do-a-deep-rearch-joyful-penguin.md`):** +15 pages (5 Go + 5 Rust + 5 Java), taking Tier L from 15 → 30 and making it the deepest non-JSON mini-hub. Web-verified against 2026 frequency/volume signals (JetBrains RustRover telemetry for Rust, current SO/blog activity for Go/Java) and deduped against all 96 live `errors/*.html` pages — no intent overlap. Registration confirmed against the live `errors.html` hub pattern: each page needs a `#errTable` row **and** a `#lang-errors` static-section `<li>`, plus a `data/error-signatures.json` record (slug/language/label/pattern — HARD 1:1 rule, currently exactly 95:95) and a `sitemap.xml` `<url>` entry (`changefreq monthly`, `priority 0.70`). Not yet built — `[ ]` below.

- [x] Go `declared and not used: x` → `errors/go-declared-and-not-used.html` (built 2026-07-19; diagnosis; sibling of `go-imported-and-not-used.html`, reciprocal link both ways; design-rationale for why it's an error not a warning, use/delete/blank-identifier `_` fixes, `:=` shadowing trap, package-level-var exemption, "assignment is not use" nuance; ~1815 words)
- [x] Go `cannot use x (variable of type T) as type U in assignment/argument` → `errors/go-cannot-use-as-type.html` (built 2026-08-04; diagnosis; no implicit conversion — numeric widening/narrowing (float→int truncates toward zero, not rounds), string/[]byte, named types sharing an underlying type (Celsius/Fahrenheit), "does not implement" interface tail incl. pointer-receiver trap; cross-links `go-panic-interface-conversion.html` both ways; ~1650 words)
- [x] Go `missing go.sum entry for module providing package X` → `errors/go-missing-go-sum-entry.html` (built 2026-08-04; **fix-first playbook**, `go mod tidy` first; go.sum vs go.mod mechanism table, Go 1.16 `-mod=readonly` default, CI read-only/no-network cache, GOPRIVATE for private modules, "commit go.sum, don't gitignore it" warning; cross-links `go-cannot-find-module-providing-package.html` both ways; ~1350 words)
- [x] Go `go: go.mod file not found in current directory or any parent; see 'go help modules'` → `errors/go-go-mod-file-not-found.html` (built 2026-08-11; **fix-first playbook**, `go mod init` first; the upward-only search explained (Go never looks *down*, which is why a visible `go.mod` in a subfolder is invisible), wrong-directory + monorepo subdirectory cases incl. `go -C dir` (Go 1.20+) and `go work init`, the longer `'go get' is no longer supported outside a module` variant → `go install pkg@version` (Go 1.16+), legacy GOPATH migration with `GO111MODULE=off` framed as an escape hatch not a fix, a dedicated **"Which module is Go actually using?"** section leading on `go env GOMOD` (path vs `/dev/null`/`NUL`, and the wrong-module-not-no-module case) rather than burying it in the checklist; PowerShell equivalents alongside the Unix `pwd`/`ls`/`find` block, with `-maxdepth` ordered before `-name` for BSD/macOS portability; 3-way module-error table vs `cannot find module providing package` and `missing go.sum entry`; **completes Tier L at 30/30**; ~1600 words)
- [x] Go `panic: interface conversion: interface {} is string, not int` → `errors/go-panic-interface-conversion.html` (built 2026-07-14; diagnosis + SVG type-assertion flow; **JSON-moat tie-in** — `map[string]interface{}` after `json.Unmarshal`, JSON→Go type table, numbers are float64, comma-ok, type switch, struct-decode fix, nil-interface edge, generics; cross-links `go-json-cannot-unmarshal.html` both ways + JSON Formatter; 1417 words)
- [x] Rust `error[E0425]: cannot find value 'x' in this scope` → `errors/rust-e0425-cannot-find-value-in-scope.html` (built 2026-08-04; diagnosis; typo, declared-in-a-different-block, used-before-its-own-`let`, missing `self.` on a struct field, item behind a disabled `#[cfg(...)]`; E0425-vs-E0433 disambiguation table; cross-links `rust-e0433-failed-to-resolve.html` + `rust-e0599-no-method-named.html` both ways; ~1500 words)
- [x] Rust `error[E0433]: failed to resolve: use of undeclared crate or module` → `errors/rust-e0433-failed-to-resolve.html` (built 2026-08-04; diagnosis; crate missing from Cargo.toml, local module never declared with `mod`, 2018-edition relative-path rules, optional-dependency/`cfg(feature)` gating; covers E0432 in-body with a comparison table; cross-links `rust-e0425-cannot-find-value-in-scope.html` + `rust-e0277-trait-bound-not-satisfied.html` both ways; ~1550 words)
- [x] Rust `error[E0502]: cannot borrow X as mutable because it is also borrowed as immutable` → `errors/rust-e0502-cannot-borrow-mutable-immutable.html` (built 2026-08-04; diagnosis + **SVG two-panel borrow-range timeline** — rejected vs accepted, showing that only the ordering changed; completes the borrow-checker trio; teaches reading the "immutable borrow later used here" annotation as the actual cause; 5 fixes, **ordered by search intent** — reorder the last use (NLL), then mutate-while-iterating promoted to Fix 2 as the dominant real-world case (`collect`+`extend`/`retain`/`iter_mut`/index loop, with the reallocation-invalidates-the-iterator rationale; anchored `#mutate-while-iterating` and linked from the Quick answer), then copy/clone out, split borrows by struct field (with an explicit note that the *method call* is what breaks it, not the field access — direct disjoint-field access compiles) (incl. `let App { .. } = self` destructuring + `split_at_mut`), `RefCell` as a knowing last resort with the `BorrowMutError` runtime-panic caveat; NLL version-pinned to 1.31/2018 and 1.36/2015; an early **"When you'll see this error"** triage section (4 situations → jump-to-fix links, NLL one-liner for the "rust NLL" long-tail, the reallocation/use-after-free rationale surfaced early, and an inline "not your error?" pointer to E0499/E0382/E0597); Fix 1 shows the ❌/✅ pair in one block (❌ commented out per §11 copy-safety) so "only the ordering changed" is visible in code as well as in the diagram; 4-way borrow-checker family table; a **See Also** block linking the underlying concepts to the Rust Book/std docs (no internal ownership/borrowing guides exist — verified before linking, so these are external rather than broken); cross-linked with E0499/E0597/E0382 both ways incl. an inline link from E0499's existing E0502 FAQ answer; ~1750 words)
- [x] Rust `error[E0599]: no method named X found for type Y in the current scope` → `errors/rust-e0599-no-method-named.html` (built 2026-07-19; diagnosis; trait-not-in-scope trap (`use std::io::Read;` + common-missing-trait table), missing generic trait bound, typo/compiler suggestion, wrong receiver (`Option<String>.len()`) + `&mut self` mutability note; cross-links `rust-e0277-trait-bound-not-satisfied.html` both ways; ~1721 words)
- [x] Rust `thread 'main' panicked at 'called Option::unwrap() on a None value'` → `errors/rust-unwrap-on-none-value.html` (built 2026-07-14; **fix-first playbook** + SVG unwrap-ladder diagram; first Rust *runtime*-panic page — unwrap_or/unwrap_or_else/unwrap_or_default, match/if let, `?`, expect, map/and_then/filter combinators, ok_or→Result, RUST_BACKTRACE; 1394 words)
- [x] Java `Error: Could not find or load main class X` → `errors/java-could-not-find-or-load-main-class.html` (built 2026-08-04; **fix-first playbook**; classpath-root vs run-directory mismatch, package-qualified invocation, jar `Main-Class` manifest, default-package case-sensitivity trap, Java 9+ module-path invocation; 3-way lookalike table vs "no main manifest attribute" and `UnsupportedClassVersionError`; cross-links `java-classnotfoundexception-noclassdeffounderror.html` + `java-unsupportedclassversionerror.html` both ways; ~1650 words)
- [x] Java `java.lang.OutOfMemoryError: Java heap space` → `errors/java-outofmemoryerror-java-heap-space.html` (built 2026-07-19; diagnosis + SVG healthy-vs-leak post-GC sawtooth comparison; leak-vs-undersized triage, `-Xmx`/`-Xms` raise, heap dump + Eclipse MAT dominator tree + leak-pattern table, streaming instead of full-load, container sizing `-XX:MaxRAMPercentage` vs hardcoded `-Xmx`; cross-links `docker-container-exited-code-137-oomkilled.html` + `javascript-heap-out-of-memory.html` both ways; 7 FAQ Q&A; ~1905 words)
- [x] Java `java.lang.UnsupportedClassVersionError: … (class file version 65.0)` → `errors/java-unsupportedclassversionerror.html` (built 2026-08-01; **NEW message-anatomy template** — decode both version numbers via `version − 44`; class-file-version↔JDK lookup table (52.0=Java 8 … 65.0=Java 21), `javap -verbose | grep major` / `file` confirm, Fix-by-raising-runtime vs lowering-target with `--release`/`maven.compiler.release`/Gradle toolchain, build-JDK≠runtime-JDK causes, legacy "Unsupported major.minor version" wording, `--enable-preview` `.65535` minor; ~1700 words)
- [x] Java `java.util.ConcurrentModificationException` → `errors/java-concurrentmodificationexception.html` (built 2026-07-14; diagnosis + SVG modCount fail-fast timeline; "concurrent" ≠ threads, for-each desugaring, set() is non-structural, Iterator.remove IllegalStateException rules, removeIf/ListIterator, Map entrySet, Stream, List.of immutability trap, Collections.synchronizedList trap, best-effort caveat; 1997 words)
- [x] Java `java.lang.NumberFormatException: For input string: "X"` → `errors/java-numberformatexception-for-input-string.html` (built 2026-08-01; **NEW message-anatomy template** — "the quotes are the input"; what's-in-the-quotes→cause→fix table, trim/`strip` (parseInt doesn't trim), hidden-char hunt (BOM 65279 / NBSP 160 via `s.length()`+char codes), grouping separator/`NumberFormat`, decimal/overflow/radix mismatches, defensive regex+catch at trust boundaries; JSON/API-adjacent → JSON Formatter; ~1750 words)

> **Batch progress (2026-07-19):** 5 more pages built — 2 from the Tier DK Docker backlog (`docker-oci-runtime-exec-not-found.html`, `docker-container-name-already-in-use.html`) and 3 from the Tier L extension (`go-declared-and-not-used.html`, `rust-e0599-no-method-named.html`, `java-outofmemoryerror-java-heap-space.html`). All exceed 1300 words, all registered in `errors.html` (table row + static category `<li>`), `sitemap.xml`, and `data/error-signatures.json` (HARD 1:1 rule — verified 108 signatures for 108 live pages), and all have reciprocal "Related Errors" links added on their named sibling pages (`docker-port-is-already-allocated.html`, `docker-exec-format-error.html`, `go-imported-and-not-used.html`, `rust-e0277-trait-bound-not-satisfied.html`, `docker-container-exited-code-137-oomkilled.html`, `javascript-heap-out-of-memory.html`).

> **Batch progress (2026-08-01):** 5 more pages built across three categories (Postgres deliberately skipped) — 2 Java (`java-unsupportedclassversionerror.html`, `java-numberformatexception-for-input-string.html`), 2 TypeScript (`ts2571-object-is-of-type-unknown.html`, `ts18048-value-possibly-undefined.html`), 1 MongoDB (`mongodb-e11000-duplicate-key-error.html`). **Introduced a 3rd page template — "message-anatomy (decode-the-error)"** — documented in `ERROR_PAGE_GUIDE.md` §1 and used for the 2 Java pages (both lead by dissecting the message's own diagnostic payload: a class-file version number, and a quoted input value). All 5 exceed 1300 words, all registered in `errors.html` (table row + static category `<li>`; DB static-section blurb updated to name MongoDB), `sitemap.xml` (lastmod 2026-08-01), and `data/error-signatures.json` (HARD 1:1 rule — signature count now 118 for 118 live pages). Reciprocal "Related Errors" links added on `java-classnotfoundexception-noclassdeffounderror.html`, `java-nullpointerexception.html`, `ts2532-object-possibly-undefined.html`, `cannot-read-properties-of-undefined.html`, and `postgres-duplicate-key-unique-constraint.html`. Database is now 4/15 (first non-Postgres entry), TypeScript 6/8 of Tier TS.

> **Batch progress (2026-08-04):** 5 more Tier L pages built — 2 Go (`go-cannot-use-as-type.html`, `go-missing-go-sum-entry.html`), 2 Rust (`rust-e0425-cannot-find-value-in-scope.html`, `rust-e0433-failed-to-resolve.html`), 1 Java (`java-could-not-find-or-load-main-class.html`), taking Tier L from 24 → 29 (of the planned 30). All exceed 1300 words, all registered in `errors.html` (table row + static `#lang-errors` `<li>`), `sitemap.xml` (priority 0.70, lastmod 2026-08-04), and `data/error-signatures.json` (HARD 1:1 rule — signature count now 123 for 123 live pages). Reciprocal "Related Errors" links added on 6 sibling pages: `go-panic-interface-conversion.html`, `go-cannot-find-module-providing-package.html`, `rust-e0599-no-method-named.html`, `rust-e0277-trait-bound-not-satisfied.html`, `java-classnotfoundexception-noclassdeffounderror.html`, `java-unsupportedclassversionerror.html`. The two Rust pages cross-link each other in-batch plus disambiguate against E0432 (in-body, not a separate page, per the canonical-no-duplicate rule) and against each other via an E0425-vs-E0433 comparison table. The Java page disambiguates against two lookalikes with a 3-way comparison table ("no main manifest attribute" and `UnsupportedClassVersionError`) rather than conflating them. Remaining Tier L gap: Go `go: go.mod file not found` and Rust `E0502 cannot borrow as mutable/immutable`.

> **Batch progress (2026-08-04, cont.):** +1 more Tier L page — `rust-e0502-cannot-borrow-mutable-immutable.html`, taking Tier L to **29/30** (only Go `go: go.mod file not found` remains). This one **carries an SVG diagram** (the `.dg-wrap` system, per `ERROR_PAGE_GUIDE.md` §8): a two-panel borrow-range timeline contrasting the rejected and accepted orderings of the same four lines, making the point that the fix is ordering rather than restructuring — the mechanism is genuinely sequential, which is the guide's bar for adding a diagram. Registered in `errors.html` (table row + `#lang-errors` `<li>`), `sitemap.xml`, and `data/error-signatures.json` (**124 signatures : 124 live pages, 1:1 held**). Reciprocal links added on all three borrow-checker siblings (`rust-cannot-borrow-as-mutable-e0499.html` — including an **inline** link inside its pre-existing "difference between E0499 and E0502" FAQ answer, `rust-e0597-does-not-live-long-enough.html`, `rust-borrow-of-moved-value-e0382.html`), completing the trio's cross-linking in both directions.

> **Batch progress (2026-08-11):** 2 more pages — `go-go-mod-file-not-found.html` (fix-first) and `docker-pull-access-denied.html` (diagnosis + SVG decision tree). **Tier L is now complete at 30/30**, closing the extension planned on 2026-07-14; the Docker page opens the Tier DK backlog at 9/15. Both registered in `errors.html` (table row + static category `<li>` — Go in `#lang-errors`, Docker in `#docker-errors` with the `err-docker` tag), `sitemap.xml` (priority 0.70, lastmod 2026-08-11), and `data/error-signatures.json` (**HARD 1:1 rule — 126 signatures for 126 live pages**). Reciprocal "Related Errors" links added on 4 siblings: `go-missing-go-sum-entry.html` and `go-cannot-find-module-providing-package.html` (completing the three-way Go module-error triangle in both directions), plus `docker-cannot-connect-to-daemon.html` and `docker-exec-format-error.html`. The Docker page deliberately disambiguates four *other* Tier DK backlog strings in-body (`manifest not found`, push-side `denied`, `unauthorized`, `toomanyrequests`) via a comparison table **without** claiming their intents — those remain unbuilt `[ ]` items, per the canonical one-page-per-intent rule. SVG judgement per `ERROR_PAGE_GUIDE.md` §8: the Docker page earns one (a genuine 4-branch decision tree from a single ambiguous message), the Go page does not (single cause, one-command fix) — diagrams are not added by default.

> **Batch progress (2026-08-12):** 3 more pages — `ts2739-type-missing-properties.html`, `ts2366-function-lacks-ending-return.html`, and `docker-failed-to-compute-cache-key.html`. **Tier TS is now complete at 8/8**, joining Tier L (30/30); Tier DK moves to 10/15. All registered in `errors.html` (table row + static category `<li>` — TS in `#typescript-errors` with the `err-ts` tag, Docker in `#docker-errors` with `err-docker`), `sitemap.xml` (priority 0.70, lastmod 2026-08-12), and `data/error-signatures.json` (**HARD 1:1 rule — 129 signatures for 129 live pages**). Reciprocal "Related Errors" links added on `ts2322-type-not-assignable.html`, `ts2532-object-possibly-undefined.html`, and `docker-pull-access-denied.html`; the two new TS pages also cross-link each other. **SVG judgement per `ERROR_PAGE_GUIDE.md` §8: 1 of 3 pages gets one** — the Docker build-context boundary is genuinely spatial and is the concept the whole error turns on, while TS2739 (a shape comparison, better served by a table) and TS2366 (a fall-through best shown as annotated code) do not. **Bookkeeping fix:** the Tier DK backlog listed `Container exited with code 137` twice — once built 2026-07-13, once still open. The duplicate is now struck through and annotated so nobody builds a competing second page for an intent that already has one.

> **Cut candidates (considered, not selected):** Go `fatal error: concurrent map writes`, Go `assignment mismatch: N variables but M values`, Rust `E0106 missing lifetime specifier`, Rust `linker 'cc' not found`, Java `ClassCastException`, Java `StackOverflowError`.

> **Recommended build order (moat-first, then highest-ROI):** (1) Python JSON-mishandling + Go `cannot unmarshal` (`string-indices`, `json-object-must-be-str-bytes`, `keyerror-python`, `go-json-cannot-unmarshal`) — reinforce the JSON moat and cross-link tools; (2) DB/SQL + Docker cluster — best traffic/competition ratio, ship together; (3) top TS codes (TS2322/2339/2532, cross-link JSON→TS); (4) remaining JS/Node + TS; (5) Go/Rust/Java flagships. **Off-moat pages (Go/Rust/Java/DB/Docker) may have no JSON-tool tie-in — link the errors hub + a relevant guide instead; "link a tool" stays best-effort.**

> **Already covered — do NOT rebuild in Batch 2:** `Unexpected end of JSON input` is handled by the Batch 1 consolidation task (`blog/json-unexpected-end-input.html` + `blog/fetch-unexpected-end-json-input.html`). Recreating it would violate the canonical one-page-per-intent rule.

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
- [x] REST vs GraphQL
- [x] JSON vs JSONL
- [x] JWT vs Session → `blog/jwt-vs-session.html`
- [x] CSV vs JSON → `blog/csv-vs-json.html`
- [ ] **Controlled monetization experiment:** one affiliate page — **Postman vs Insomnia vs Bruno** — with `rel="sponsored nofollow"` links + a disclosure line, purely to observe monetization behavior. Avoid SaaS head-to-head beyond long-tail developer intent.
- Each page: Quick-answer + comparison table + FAQ schema; cross-link the cluster + anchor to a relevant tool.
- Existing `/blog/` comparisons (`json-vs-xml`, `yaml-vs-json`, `protobuf-vs-json`) stay put and cross-link into the new hub (no duplicate intent).

### 3. HTTP Status Quiz Game — AUTHORITY + LINKS ENGINE
- [x] `http-status-quiz.html` + `js/http-status-quiz.js` — interactive client-side quiz (mixed formats, weighted difficulty ramp, streak, shareable rank + static score cards). Shared data in `js/http-status-data.js`.
- [x] `http-status-flashcards.html` + `js/http-status-flashcards.js` — companion study mode (own indexable/shareable URL).
- [x] Link heavily to `/http-status/` (hub banner + per-code "Learn more" links); registered in nav "Other Tools", `json-tools.html`, `sitemap.xml`. See `HTTP_STATUS_QUIZ_PLAN.md`.
- **Primary goal:** backlinks, engagement, internal-link amplification.
- **Launch requires external distribution** (Hacker News / Reddit / Product Hunt maker post — *owner action*; the asset is built share-ready). **v1.1 backlog:** embed widget (`http-status-quiz-embed.html`) + runtime canvas share card.

### AI Tool for this window — LLM API Cost Calculator
**Status: APPROVED — DEFERRED. Build after the rest of Phase 7 (error cluster first).** Full
detailed spec lives at `C:\Users\PC\.claude\plans\so-what-we-remain-flickering-peach.md`.
- [ ] `llm-cost-calculator.html` + `js/llm-cost-calculator-tool.js` — tokens (manual entry or paste-to-estimate, `~4 chars/token`) × model → cost across providers, side by side. Fully client-side.
- [ ] **Single maintained pricing data file** `js/llm-pricing-data.js` (dual-export like `http-status-data.js`) with a visible **"Prices last verified YYYY-MM-DD"** stamp; numbers from each provider's official pricing page only (never cross-checked against other AI tools). Schema adds `pricingUnit`, optional `tier`/`category` for future-proofing.
- [ ] **Build-time truth rule (HARD):** the canonical model list is whatever is on each provider's official pricing page *at build time*. Do not carry model names/prices forward from this doc (seed only) without re-verifying; **exclude any model not on the official page — never guess or preserve a stale entry.**
- [ ] **Zero-drift rule (HARD):** `LLM_PRICING` is the only source. A build-time generator `scripts/gen-llm-content.js` regenerates the "Cheapest LLM APIs" ranked list, the FAQ price answers (real model-specific numbers + "as of {lastVerified}"), and the FAQPage JSON-LD as static crawlable HTML between `<!-- GEN -->` sentinels — never hand-edit those separately. In-tool results table is JS-rendered live.
- [ ] **Honesty/E-E-A-T:** prominent freshness banner ("prices change frequently — confirm on official pages"), amber stale-warning when `lastVerified` > 21 days, and a "Why is this only an estimate?" section (tokenizers differ per model). Maintenance reality: ~biweekly re-verify (~20 min).
- [ ] Sort toggles: blended cost (default, uses user's input/output split), input cost, output cost, context window. Analytics: `llm_calc_used`, `llm_pricing_click`, `llm_provider_filter`.
- Target **long-tail** ("gpt-4o api cost per 1k tokens", specific-model cost), not the saturated head term.
- *Caveat: crowded niche (10+ existing tools) + ongoing price-maintenance burden — this is an ongoing ops product, not a one-time build, and the AI bet for this window, not an impression guarantee.*

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
