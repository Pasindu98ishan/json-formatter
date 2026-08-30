# Error Reference Page — Standing Build Guide

This is the authoritative checklist for building or editing any page under `errors/*.html`. Read this before writing a new error page. It exists so the conventions survive across sessions instead of being re-derived (or missed) each time.

## 1. Four templates — pick whichever fits the error

- **Fix-first playbook** — leads with the single fastest fix, then a triage/decision section, then numbered `Fix 1..N`. Use when there's one dominant fix most readers want immediately (e.g. `docker-container-name-already-in-use.html`, `docker-no-space-left-on-device.html`).
- **Diagnosis style** — leads with a triage/decision process (often an SVG decision tree), because the same error string has genuinely different root causes that need distinguishing first (e.g. `docker-oci-runtime-exec-not-found.html`, `rust-e0599-no-method-named.html`).
- **Message-anatomy (decode-the-error)** — leads by dissecting the error message's *own* diagnostic payload part-by-part, because the message already contains the answer and the reader just can't parse it: a version number (`class file version 65.0`), a quoted input value (`For input string: "1,234"`), a caret/`LINE N:` pointer, a `HINT:`/`DETAIL:` line, or a stack frame. The first substantive section is an **"Anatomy of the message"** block (often a labelled breakdown or a lookup table mapping each fragment to its meaning), *then* the fixes follow from what the reader decoded. Use when the fastest path to a fix is teaching the reader to read what the runtime already told them (e.g. `java-unsupportedclassversionerror.html` — decode `65.0` → JDK via a version table; `java-numberformatexception-for-input-string.html` — decode the exact quoted string, including invisible characters). Applies the standard schema/registration rules like the other two.

- **Consequence error (this is not your error)** — for messages that are a *symptom* of an earlier failure rather than a cause. The page's whole job is to redirect the reader upstream: lead by saying plainly that the message they searched is not the problem, then make **finding the original error** the first numbered fix (logs, live state tables, "log the first exception not the last"), and only then cover recovery. Everything the incumbent pages treat as the answer — the recovery command — is the *second* half here. Use when the error is downstream of something else: `postgres-current-transaction-is-aborted.html` (25P02 is emitted by every statement after the real failure), and any "cascade" error where the reader is staring at victim number five.

Any of the four is acceptable; choose fix-first when there's one obvious fix, diagnosis when there are several divergent causes to distinguish, message-anatomy when the message itself is a rich diagnostic the reader needs decoded first, and consequence when the message is downstream of the failure that actually matters.

## 2. Required page structure

- Exact error string in the `<h1>` **and** repeated verbatim in the body (a code block showing the real terminal/stack output).
- **Cover the error's variant wordings** in that exact-string block — older toolchain phrasings (`declared but not used` vs `declared and not used`), Podman vs Docker, `docker run` vs `docker exec` message differences. People search the exact string they got, which may not be the current one.
- A "Quick answer" box immediately after the header: `style="background:var(--light-bg);border:1px solid var(--border-color);border-left:4px solid var(--primary-color);border-radius:8px;padding:1rem 1.5rem;margin:0 0 1.5rem;"` — 2-4 bullet decision points, not a full explanation.
- **A short cause paragraph (2-3 sentences) immediately after the exact-string block** — answers "what does this mean." The long mechanism/design-rationale section can stay lower down and answers "why is it built this way." These are not duplicates, and featured-snippet extraction wants the short one on the first screen.
- Body sections covering: why it happens (root cause, not just "how to fix"), each fix as its own `<h2>`, a debugging checklist (`<ul style="list-style:none;padding-left:0;">` with `&#10003;` bullets).
- **Show expected output, not just commands** — `docker rm myapp` echoing `myapp`, `which bash` printing nothing, `ls -l` showing the missing `x` bit. This is the difference between a reader knowing they succeeded and re-running things blindly.
- A comparison/quick-reference `<table>` when the page's value is disambiguating from a lookalike error.
- **Word count target: 1300+ words** of actual article body (not counting nav/footer chrome).
- **Inline contextual cross-links in body prose**, not only in the bottom link blocks — this is a recurring miss the user has flagged more than once. Link a related error/tool where the text naturally mentions the concept.
- Titles should be clickable/non-branded — no "| JSON Dev Tools" suffix.
- Add an SVG diagram (`.dg-wrap` system, see §5) only when the mechanism is genuinely multi-step/sequential/decision-shaped. Most pages get none — don't force one.
- **A `<h2>References</h2>` block, placed immediately before `<div class="tool-cta">`.** All 129 pages carry one; a new page without it is the odd one out. Format, 2–3 entries:
  ```html
  <h2>References</h2>
  <ul>
      <li><a href="URL" target="_blank" rel="noopener">Page title</a> (Source name)</li>
  </ul>
  ```
  Rules: **primary sources only** — the language spec, the compiler's own error index, or the vendor's reference; never a blog or Stack Overflow. Prefer the *exact* page for that error over a doc homepage (Rust has per-code pages at `doc.rust-lang.org/error_codes/E0499.html`; MDN has per-error pages; TSConfig Reference has per-flag anchors). **Verify before shipping** — check the page returns 200 *and*, if you used a `#fragment`, that the anchor id actually exists in the HTML. Two real misses came from skipping that: an MDN page that never existed, and a Node.js anchor renamed from `-in-mebibytes` to `-in-megabytes`. Don't repeat a URL already linked inline elsewhere on the page.

## 3. JSON-LD (exact set, in this order)

1. `BreadcrumbList` — Home → Error Reference (`../errors.html`) → this page.
2. `Article` — **must include `"image": "https://jsondevtools.org/og-image.png"`** (a previously backfilled site-wide gap — `og:image` meta alone is not enough, some AEO/GEO surfaces read schema image separately). Include `datePublished`/`dateModified`, `author`, `publisher`.
3. `FAQPage` — see hard rule below.

**No `HowTo` schema** on these pages — established convention, don't add it.

## 4. HARD RULE: FAQ parity

The number of `Question` entries in the `FAQPage` JSON-LD **must exactly equal** the number of visible `<details>` elements in the `<section class="faq-section">`, and the text must match verbatim. This has been a real, previously-shipped bug on two live pages (`blog/json-date-format.html`, `blog/json-unexpected-end-input.html` — the latter had FAQ schema with *zero* visible FAQs). Verify with a script, don't eyeball it:

```python
import json, re
html = open(path, encoding='utf-8').read()
ldjson = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
faq = [json.loads(b) for b in ldjson if json.loads(b).get('@type') == 'FAQPage'][0]
schema_count = len(faq['mainEntity'])
details_count = len(re.findall(r'<details>', html))
assert schema_count == details_count
```

## 5. HARD RULE: `data/error-signatures.json` is 1:1 with `errors/*.html`

Every new `errors/*.html` page **must** get exactly one matching record in `data/error-signatures.json` (consumed by the Error Log Analyzer tool). No missing pages, no orphan records.

```json
{ "slug": "my-new-error.html", "language": "Go", "label": "exact <h1> / error string", "pattern": "case-insensitive regex fragment, distinctive substring" }
```

- `slug` = exact filename in `errors/`.
- `pattern` is a JS RegExp *source string* (escape metachars); the analyzer adds the `i` flag itself. Test it mentally against a realistic pasted stack trace, not just the clean string.
- Optional `"w": 0` demotes an overly generic page so a more specific one outranks it in matching.
- **Verify:** `len(signatures) == len(errors/*.html)` after every batch. As of 2026-08-29 this is 131:131.
- **Test the pattern against real driver traces, not the clean string.** Compile every signature with the `i` flag, then assert the new one matches a realistic paste from each ecosystem (psql, psycopg2, JDBC/`PSQLException`, ActiveRecord/`PG::`, Django) **and** that it does *not* match neighbouring errors. Cheap and it catches over-broad patterns: `relation "[^"]+" does not exist` must not swallow `column "x" does not exist` or `function x(...) does not exist`.

## 6. Registration checklist (every new page needs ALL of these)

1. `errors/<slug>.html` — the page itself.
2. `errors.html` — **two** additions: a `<tr>` table row in the relevant language/category table, **and** a `<li class="err-cat-item">` in the matching static `#<category>-errors` section (e.g. `#docker-errors`, `#lang-errors`).
3. `sitemap.xml` — one `<url>` block, `<changefreq>monthly</changefreq>`, `<priority>0.70</priority>`, `<lastmod>` = build date.
4. `data/error-signatures.json` — one record (§5).
5. Reciprocal links — go to the page's topical siblings (already-live pages that should link forward to the new one) and add it to their "Related Errors" list. Don't only link outward from the new page; the inbound link is what actually moves internal PageRank and CTR to it.
6. If the page belongs to a phase-planning doc (`PHASE_*_PROPOSAL.md`), flip its checkbox `[ ]` → `[x]` with a one-line built-description (date, template style, key topics covered, word count).

Verify with a script after building a batch:
```python
for slug in new_pages:
    print(slug, 'errors.html:', errors_html.count(slug), 'sitemap:', sitemap.count(slug), 'sigs:', sigs.count(slug))
# expect errors.html:2 sitemap:1 sigs:1 for every page
```

## 7. Dark mode

CSS custom properties (`--light-bg`, `--border-color`, etc.) are defined in `:root` in `css/styles.css`. **`css/dark-mode.css` must explicitly re-declare any var used inline via `style="...var(--x)..."` under its `body.dark-mode` block**, or the inline box silently stays light-themed in dark mode. This was a site-wide bug (~305 occurrences) fixed once at the root — don't reintroduce it by inventing a new inline var without checking it's already overridden in `dark-mode.css`.

## 8. SVG diagram system (`.dg-wrap`)

Lives in `css/blog.css` (search `Inline SVG diagrams`). Classes: `.dg-wrap`, `.dg-box`, `.dg-box-ok/bad/muted`, `.dg-t/m/s`, `.dg-ok/bad`, `.dg-ln/-ok/-bad/-dash`, driven by CSS custom properties defined for both `:root` and `body.dark-mode` — diagrams auto-adapt to dark mode, no per-page CSS needed (every error page already links `blog.css`).

- Use **inline SVG**, never ASCII art in a code block (ASCII renders on a dark code background with broken/misaligned arrows — explicitly rejected by the user).
- Pattern: `<div class="dg-wrap"><svg viewBox="0 0 W H" role="img" aria-label="full text description"> ... </svg><p class="dg-cap">one-line takeaway</p></div>`.
- Give each SVG's arrowhead `<marker>` a unique id per page; arrowhead `<path>` uses `style="fill:var(--dg-line)"` (or `--dg-ok`/`--dg-bad`).
- Only add a diagram when the mechanism is genuinely sequential/decision-shaped and hard to convey in prose (a decision tree, a two-phase protocol, a timeline). Single-cause errors get no diagram — most pages should have none.

### 8a. Real captured-output images

Separate from the `.dg-wrap` explanatory diagrams: a page may ship **one image of the actual error**, which is stronger evidence than any drawing and gives the page a legitimate `ImageObject`. Build it from output you really captured (see 9b), not from an invented transcript.

- File lives in `errors/img/<slug>.svg`, hand-written SVG styled as a terminal — self-contained colours, so it reads the same in light and dark mode like a real screenshot.
- Reference it **three** ways: `<img>` inside `<figure class="perm-figure">` with a full `alt`, `og:image`/`twitter:image`, and an `ImageObject` in the Article schema (`url` + `contentUrl` + `caption` + `width`/`height`) — this replaces the default `og-image.png` string for that page. Existing examples: `unterminated-string.svg`, `not-json-serializable.svg`, `current-transaction-is-aborted.svg`.
- Use the `figcaption` to point at what's easy to miss in the capture. On the 25P02 page that's the psql prompt flipping `=*#` → `=!#`, and `COMMIT` being answered with `ROLLBACK`.

## 9. Verification pass (run before calling a batch done)

Script-check for every new/edited page:
- Exactly one `<h1>`.
- Every `<script type="application/ld+json">` block is valid JSON (`json.loads`).
- FAQ schema count == visible `<details>` count (§4).
- Article schema has `"image"`.
- Meta description ≤ ~165 chars.
- No broken relative links (`os.path.exists` on every relative `href`).
- Word count ≥ 1300.
- Registration counts per §6.
- Exactly one `<h2>References</h2>` block, with ≥ 2 `<li>` entries (§2).
- Every external `href` returns 200, and any `#fragment` resolves to a real `id` in the fetched HTML — check the anchor separately from the page, since a renamed anchor still returns 200.

### 9a. Technical accuracy pass (facts, not structure)

The structural checks above have never been the failure mode; the structure has been clean every time. The failures are factual. Some of this can be executed rather than reasoned about — see 9b, and prefer that wherever the runtime will start in a container. The rest is judgment. Do it deliberately:

- **Actually execute it — don't just mentally execute it.** Where the runtime can be started in a throwaway container, run every claim and paste back the *real* output. This is now the highest-value step on the page, and it has caught defects that careful reading did not (see 9b). Mental execution remains the fallback for things you genuinely cannot run; for any block with an error message in a comment, the message must follow from that exact code, including the line:column if you quote one.
- **Verify every command actually runs as written.** The real bug this caught: `go vet -vettool=$(which shadow)` fails confusingly because `shadow` isn't in the default toolchain — `which shadow` expands to nothing. If a command needs an install step or a driver-specific precondition, show it.
- **Version-pin every claim.** Any statement about a language, runtime, or library gets an explicit version boundary, stated inline ("since JDK 9", "rand 0.9+", "JDK 8 only — removed in 9"), not written timelessly. Check: default collectors/GCs, renamed APIs, removed flags, changed error wording. Real example: `rand::Rng::gen()`/`gen_range()` were renamed to `random()`/`random_range()` in rand 0.9 because `gen` collides with Rust 2024's `gen` blocks.
- **Flag deprecated tooling** rather than presenting it as current: `jcmd` over `jmap`, `-Xlog:gc*` over `-XX:+PrintGCDetails`.
- **Compiler/runtime message strings must be verbatim** from a real version's output — the whole value proposition is matching what the user pasted into search. Do not invent or paraphrase help text. Where the wording genuinely varies across versions (rustc's "similar name" hint does), quote one real form rather than inventing a synthetic "canonical" one.
- **When acting on review feedback, re-read the current file first.** Review notes are frequently written against an earlier draft — on 2026-07-20, four of six claimed factual defects were already fixed in the live files. Verify before editing, and say so when a claim doesn't hold.

### 9b. Verify against a real runtime in a container

For anything with a runnable engine — Postgres, MySQL, Redis, Node, Python, a compiler — start it in Docker, reproduce the error, and copy the output verbatim. It costs a few minutes and it is the difference between a page that quotes documentation and one that quotes reality.

```bash
docker run -d --name pgverify -e POSTGRES_PASSWORD=x -e POSTGRES_DB=appdb postgres:16-alpine
# wait for readiness, then feed it a .sql file of every claim the page makes
docker cp verify.sql pgverify:/tmp/v.sql
docker exec pgverify psql -U postgres -d appdb -f /tmp/v.sql
docker rm -f pgverify        # always clean up
```

Write the verification script as *the page's claims in order*, so the output doubles as the page's evidence. Capture and reuse: exact message text (`ERROR:` has **two** spaces after it in psql), `DETAIL:`/`HINT:` lines, SQLSTATE codes and their symbolic names, default setting values, and the real log-line format.

Note in the build log which version you verified against ("verified on PostgreSQL 16.15") and version-pin claims accordingly.

**Defects this caught that review did not:**
- `txid_current_if_assigned()` was written up as a way to tell whether you're in a transaction. It returns `NULL` until the transaction *writes*, so a read-only transaction is indistinguishable from none. The page now documents that as a trap.
- A `pg_class` triage query used `ILIKE 'users'`; switching it to `=` (as review feedback suggested) returned **zero rows** for the mixed-case `"Users"` table the section existed to diagnose. `lower(relname) = lower(...)` was the actual fix — case-insensitive without `ILIKE`'s `_`/`%` wildcard semantics.
- Review claimed `SET` is permitted in an aborted transaction. Testing showed `SET`, `SHOW`, `RESET`, `SET TRANSACTION`, `SAVEPOINT` and `RELEASE SAVEPOINT` are *all* rejected with 25P02; only transaction-ending statements pass.

The pattern: **test the review feedback too.** Two of three review points above were wrong, and only running them showed it.

## 10. Search-intent coverage audit (do this BEFORE writing)

List the distinct user situations that produce this exact error string, then check each one has a section. **Same error, different entry point counts as a distinct situation** — `docker run` vs `docker exec` vs Compose; local dev vs CI; a std-lib trait vs a trait you wrote yourself.

A cause you can name but chose not to cover is a gap, not a scope decision. Write the intent list explicitly before drafting — don't rely on `<meta name="keywords">` as a stand-in for it (that tag does nothing for ranking; it's a leftover, not a plan).

### 10a. Read the incumbents first, and write down what they miss

There is no point being the fifteenth page that says the same thing. Search the exact error string, open the top two or three results, and inventory **what each one covers and what it omits**. The omissions are the page's reason to exist; build sections around them.

Both PostgreSQL pages were shaped this way. For `relation does not exist`, the top-ranked result covered exactly two causes (typo, wrong case); nobody covered `search_path`, non-table relations, temp tables under pooling, or the schema-`USAGE` case that produces the same message. For `current transaction is aborted`, the incumbents all explained `ROLLBACK` and savepoints but none explained **how to find the original error** — which is the only thing the reader actually needs.

Record the gap list in the phase doc's build entry, so the differentiation is auditable later.

### 10b. Mine Stack Overflow for questions that never got a good answer

Unanswered high-traffic questions are the sharpest signal of a real content gap. Stack Overflow blocks our crawler, but the **Stack Exchange API** is open and needs no key for light use:

```bash
curl -s --compressed   "https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&q=YOUR+ERROR+STRING&accepted=False&site=stackoverflow&pagesize=30"
```

Sort the results by `view_count` and look for high views with `answer_count: 0` or no accepted answer. Each one is a section the page should have.

What this surfaced for 25P02: *"SQLState 25P02 … **with no transaction**"* — 43,759 views, no accepted answer — became the "but I never wrote BEGIN" section on implicit transactions. *"Handle psycopg2.InternalError…"* — 5,120 views, **zero** answers. Two more (10k and 13.8k views) both asked how to find the original error, confirming the gap already spotted in 10a.

Answer those questions *on the page*, in the asker's words, and the FAQ entries write themselves.

## 11. Code block copy-safety

Every code block has a Copy button, so **any block with one must be safe to paste whole.** The ✅/❌ teaching convention is good — the bad line just has to be inert.

- Comment out the ❌ variant, or split good and bad into two separate blocks.
- Never leave a runnable-but-wrong line active in a block a reader might paste — e.g. a Dockerfile block where the broken `CMD` is still live, or a shell block where the destructive form isn't commented.
- Bare API calls that only work under conditions explained in the following prose (`jdbc.setFetchSize(1000)`) should carry the precondition as an inline comment in the block itself, since the block travels without the paragraph.

## 12. Misc conventions

- Author byline: `Pasindu Ishan`, linked to `../about.html`.
- `google-adsense-account` meta + adsbygoogle script tag: `ca-pub-3477621730217949` (real ID, live site-wide since 2026-07-13).
- Bottom `.tool-cta` block: **All Error References** + a relevant tool + (when a Docker/off-moat page has no natural JSON-tool tie-in) link the errors hub + a relevant guide instead — "link a tool" is best-effort, not mandatory.
- `Related Errors` / `Related Guides` sections at the very bottom, outside `<article>`, inside `<main>`.
