# Error Reference Page — Standing Build Guide

This is the authoritative checklist for building or editing any page under `errors/*.html`. Read this before writing a new error page. It exists so the conventions survive across sessions instead of being re-derived (or missed) each time.

## 1. Two templates — pick whichever fits the error

- **Fix-first playbook** — leads with the single fastest fix, then a triage/decision section, then numbered `Fix 1..N`. Use when there's one dominant fix most readers want immediately (e.g. `docker-container-name-already-in-use.html`, `docker-no-space-left-on-device.html`).
- **Diagnosis style** — leads with a triage/decision process (often an SVG decision tree), because the same error string has genuinely different root causes that need distinguishing first (e.g. `docker-oci-runtime-exec-not-found.html`, `rust-e0599-no-method-named.html`).

Either is acceptable; choose based on whether the error has one obvious fix or several divergent causes.

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
- **Verify:** `len(signatures) == len(errors/*.html)` after every batch. As of 2026-07-19 this is 108:108.

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

### 9a. Technical accuracy pass (cannot be scripted — do it by hand)

The structural checks above have never been the failure mode; the structure has been clean every time. The failures are factual. Do these deliberately:

- **Mentally execute every code sample against the error it claims to produce.** For any block with an error message in a comment, verify the message actually follows from that exact code — including the line:column in the annotation if you quote one. This is the single highest-value check on the page and nothing above catches it.
- **Verify every command actually runs as written.** The real bug this caught: `go vet -vettool=$(which shadow)` fails confusingly because `shadow` isn't in the default toolchain — `which shadow` expands to nothing. If a command needs an install step or a driver-specific precondition, show it.
- **Version-pin every claim.** Any statement about a language, runtime, or library gets an explicit version boundary, stated inline ("since JDK 9", "rand 0.9+", "JDK 8 only — removed in 9"), not written timelessly. Check: default collectors/GCs, renamed APIs, removed flags, changed error wording. Real example: `rand::Rng::gen()`/`gen_range()` were renamed to `random()`/`random_range()` in rand 0.9 because `gen` collides with Rust 2024's `gen` blocks.
- **Flag deprecated tooling** rather than presenting it as current: `jcmd` over `jmap`, `-Xlog:gc*` over `-XX:+PrintGCDetails`.
- **Compiler/runtime message strings must be verbatim** from a real version's output — the whole value proposition is matching what the user pasted into search. Do not invent or paraphrase help text. Where the wording genuinely varies across versions (rustc's "similar name" hint does), quote one real form rather than inventing a synthetic "canonical" one.
- **When acting on review feedback, re-read the current file first.** Review notes are frequently written against an earlier draft — on 2026-07-20, four of six claimed factual defects were already fixed in the live files. Verify before editing, and say so when a claim doesn't hold.

## 10. Search-intent coverage audit (do this BEFORE writing)

List the distinct user situations that produce this exact error string, then check each one has a section. **Same error, different entry point counts as a distinct situation** — `docker run` vs `docker exec` vs Compose; local dev vs CI; a std-lib trait vs a trait you wrote yourself.

A cause you can name but chose not to cover is a gap, not a scope decision. Write the intent list explicitly before drafting — don't rely on `<meta name="keywords">` as a stand-in for it (that tag does nothing for ranking; it's a leftover, not a plan).

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
