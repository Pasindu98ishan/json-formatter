# AdSense Re-Apply Readiness Plan — build Sep 21 – Oct 4, 2026, apply Oct 20, 2026

> Written 2026-09-20. Internal planning doc: `build_site.py` skips `*.md`, so it is not published.
> Source of truth for the plan (rev 2, approved 2026-09-20). Update the checkboxes and the progress log as work lands.

## 1. Why this plan exists

The site was rejected for "Low value content" (applied 2026-07-13, about 11 days after the pub ID went live). The exact rejection text was never recorded (see Day 1, task 1).

Audits on 2026-09-20 (content, technical, and `docs/audits/adsense-content-audit-2026-07-24.html`) plus an outside review found:

- **The tools are fine.** Formatter, homepage and page structure are strong. Per-page thinness, duplicate titles, orphans and broken internal links are not the problem. Leave them alone.
- **The trust pages contradict the site** (highest priority; it is the first thing a reviewer checks):
  - `about.html`: says "20+ tools" (site has 40+); lists regex tester and color converter as "coming next" (both exist); says Google Analytics is the only external service (AdSense is present too); criticises other sites for being "cluttered with ads".
  - The privacy policy says input "may" be cached in localStorage; the homepage says nothing you paste is stored. The code does save it (`formatterInput`, `js/app.js:107`, `js/codemirror-setup.js:137`).
  - The privacy policy has a title-only meta description, template wording, no GDPR section, and a "Last Updated" date that is the application day.
- **A real privacy leak:** `handleShare()` (`js/app.js:373`) puts the pasted JSON in the **query string** (`?j=`). GA4 records the full page URL, and the GitHub Pages server receives it. `jsonpath` and `regex-tester` shares use `#` fragments and are fine.
- **The error library reads as broad and generic**, not as the work of someone with real expertise. Every byline says "Software Developer"; the author's actual background is senior engineering on Java, Kafka, Flink and PostgreSQL in production. First-hand material on those pages is the biggest unused asset and beats extra word count.
- **Error hub (`errors.html`):** static HTML shows "0 errors documented" (`#errCount`, JS-filled); "Last updated: June 2026"; an unverifiable "Most-referenced fixes… this month" list; an "authoritative reference" claim; no explanation of why a JSON site covers Rust, Java, Postgres and Kafka.
- **Technical and compliance:** no CMP for EEA/UK traffic (AdSense and GA4 load unconditionally); ad loader on `404.html` and a noindex page; placeholder ad slot and `js/ad-tests.js` in production; 4 blog pages with invalid JSON-LD; 137 over-length meta descriptions and 201 over-length titles.
- **Scaled-content footprint (July audit):** 136 error pages, 16 status pages and 5 chmod posts on one skeleton, with the same author bio on 242 pages; 38 more error pages queued in `PHASE_7_PROPOSAL.md`.

## 2. Decisions (approved 2026-09-20)

- New pages slowed to **1–2 a week** (not frozen). Each must be a different format from the error template and clearly better than the current top results.
- Weak pages are improved with **first-hand material**, not a word-count target. Merges only for clear duplicates, using canonical tags (GitHub Pages cannot 301).
- Input caching: **keep it and disclose it plainly** (this device only, never sent anywhere, visible Clear button).
- Author detail: **role and stack, no employer or client**. Production stories are anonymized ("a real-time monitoring pipeline").
- Privacy Policy and Terms move to **root URLs**, with meta-refresh stubs at the old `/blog/` URLs.
- The error hub gets an honest scope statement. Nothing is trimmed now (revisit after the re-application).

**Honesty rule:** every "from production" passage comes from notes the author supplies, and every version or reproduction claim must be something actually run. If there is no real story for a page, that page gets no such section. Nothing is invented and nothing names an employer or client.

## 3. Skills and tools

| Skill / tool | Used for |
|---|---|
| `seo-technical` | JSON-LD, sitemap `lastmod`, robots/ads.txt, redirects/canonicals for the moved legal pages |
| `seo-onpage` | title and meta-description rewrite, og/twitter tags, privacy/terms meta |
| `seo-content-audit` | overlap-cluster decisions, choosing which error pages get first-hand sections |
| `seo-site-health-audit` | triage order for anything found late |
| `frontend-design` | accessibility and polish (skip link, focus styles, contrast, labels) |
| `seo-aeo-geo` / `SEO-GEO-AEO-Skill` | `llms.txt` refresh, answer-first check on rewritten pages (light touch) |
| `seo-offpage` | 3–5 genuine external signals (parallel track) |
| `seo-audit-orchestration` | final go/no-go audit (Day 14) |
| `/code-review`, `/security-review` | each week's diff, especially share-link and consent changes |
| `scripts/build_site.py`, `check-meta-description.js`, `indexnow-submit.mjs` | existing gates and submission |

**Not runnable:** `seo-keyword`, `seo-keyword-gap-audit`, `seo-competitor`, `seo-backlink-audit`, `seo-rank-tracking`, `seo-traffic-diagnosis`, `seo-content-gap-audit` need an Ahrefs MCP, which is not connected. Use Search Console exports instead.

## 4. Checklist

### Week 1 (Sep 21–27): trust, privacy and technical blockers

**Day 1 (Mon Sep 21): the leak and the blockers**
*Day 1 done 2026-09-20 (worked ahead of schedule). Nothing committed yet.*
- [x] **You:** find the AdSense rejection reason and per-issue detail; paste it into the log (section 7) — pasted 2026-09-20
- [x] Share link: `handleShare()` writes `#j=`; `loadSharedJSON()` and `restoreFormatterInput()` read the fragment (`getSharedPayload()` in `js/app.js`)
- [x] Legacy `?j=` links still load, then the query is stripped with `history.replaceState` (other params kept)
- [x] `js/analytics.js`: `page_location` = origin + path + query without `j`, never the `#fragment` (also covers the `#q=` JSONPath and `#r=` regex share links)
- [x] Audit other `location.search` uses and persisted-input callers (results in section 7)
- [x] Fix invalid JSON-LD: `blog/json-to-typescript.html`, `jsonpath-guide.html`, `xml-to-json.html`, `yaml-to-json.html`. The Article and FAQPage blocks (script tags included) were written with curly quotes, so Google saw no schema on those pages.
- [x] ~~Add missing `datePublished`~~ not needed: every Article already has one; the earlier audit only saw "missing" because the blocks did not parse
- [x] `scripts/build_site.py`: fails on malformed `ld+json` tags and unparseable JSON-LD (tested with a bad page)
- [x] Remove `js/ad-tests.js` include and the placeholder `<ins data-ad-slot="XXXXXXXXXX">` from `formatter.html`
- [x] Stop publishing `js/ad-tests.js` and `js/tests.js` (`DEV_ONLY` in `build_site.py`; build is 426 files, was 428)
- [x] Remove AdSense loader and `google-adsense-account` meta from `404.html` and `http-status-flashcards.html`
- [x] Bonus, same class of defect: decoded `&mdash;` / `&ndash;` / `&amp;` literals inside JSON-LD on 55 pages (they would show as raw entity text in rich results)

**Day 2 (Tue Sep 22): About, Privacy, root URLs**
*Day 2 done 2026-09-21 (a day early). Nothing committed yet.*
- [x] `about.html`: author section on real role and stack; job title confirmed as **Senior Software Engineer, Data Streaming**; no employer or client named
- [x] `about.html`: 40+ tools in title/meta/body; full linked tool list (38 tools + 3 references); stale "coming next" replaced with an honest "what comes next"
- [x] `about.html`: AdSense, GA4, CDN libraries and the fetch/repair features stated plainly; "cluttered with ads" and "no build step / no CDN" claims removed; Person schema no longer asserts an employer (`worksFor` dropped)
- [x] `blog/jsonformatter-org-alternative.html`: removed the "ad-light / Ad-supported" comparison row
- [x] Byline updated to the new title on 242 pages; Person `jobTitle` updated on about.html. (The verbatim author-bio paragraph, "a software developer based in Sri Lanka", is on 242 pages and is replaced in Week 2 Days 8-9.)
- [x] "All rights reserved" aligned: Terms section 2 now says tools are free for personal and commercial use and content/design/code stay copyrighted; `contact.html` FAQ already said so. Contact page also fixed ("stores nothing about you", "no marketing cookies") and its author line updated.
- [x] Privacy Policy rewritten in plain language: what stays in the browser, formatter `formatterInput` storage with Clear, fetch/repair/CDN requests, share links (fragment) and an honest note on pre-Sep-21 `?j=` links, GA4, AdSense, hosting, EEA/UK section, retention, children
- [x] Privacy Policy: GDPR/EEA section, unique meta description, revision date September 21, 2026, og/twitter tags
- [x] Homepage paragraph and formatter page reworded ("nothing uploaded or logged; input saved in this browser only, Clear removes it"); formatter share note says anyone with the link can read the JSON
- [x] Privacy and Terms moved to `/privacy-policy.html` and `/terms-of-service.html`; meta-refresh stubs (canonical to new URL, no analytics or ads) at the old `/blog/` URLs; verified in a browser that the stub lands on the new page
- [x] Footer link updated on 291 pages (584 hrefs); `sitemap.xml` entries swapped (lastmod 2026-09-21); `llms.txt` had no legal-page references; the build's broken-link check passes
- [x] Off-page track started: first external post drafted in `docs/off-page/post-1-share-link-leak.md` (about the share-link leak and its fix). **You** review, edit and publish it by Day 5.

**Days 3–4 (Wed–Thu Sep 23–24): consent, Terms, error hub**
*Code-side work done 2026-09-22 (two days early). Nothing committed yet. **Not fully done:** the one item only you can do is still open — nothing shows to a visitor until you publish the message.*
- [x] **You:** GDPR message created in AdSense → Privacy & messaging (2026-09-22; logo from `docs/brand/`, "Do not consent" on for EEA + UK + Switzerland). **It cannot serve until the site is approved**, so `?fc=alwaysshow&fctype=gdpr` shows nothing today; that is expected. Site code is live (commit `c9d159a`). Until approval, EEA/UK visitors stay at default-denied (no GA4 counting for them). Confirm the message status says **Published**, not Draft, and re-test the banner after approval.
- [x] CMP snippet added site-wide (294 pages, all but the two meta-refresh stubs): `js/consent.js` (Consent Mode v2 defaults — denied by default for the EEA/EFTA/UK/Switzerland, granted elsewhere, matching prior behavior), Google's Funding Choices message loader, and `js/fc-present.js` (Google's standard "CMP is present" signal). All three are Google's documented integration pieces, not invented.
- [x] GA4 gated by Consent Mode v2 (default denied for EEA/UK via `js/consent.js`, read before GA4's config call); `defer` added to the `<script src="/js/analytics.js">` tag on all 294 pages
- [x] Terms rewritten in plain language to match the Privacy Policy; same section content (personal+commercial use, copyright, no warranty, liability limits, links, governing law, your input, acceptable use, suspension, contact), dated September 22, 2026
- [x] `errors.html`: count baked into static HTML as **147** (not 136 — the table also carries 11 legacy error posts still hosted under `blog/`, which the original plan text didn't account for; corrected here). `build_site.py` now fails if `#errCount` doesn't match the table's real `<tbody>` row count (tested: changing it to 99 correctly fails the build).
- [x] `errors.html`: "Last updated" now reads September 2026 and `build_site.py` fails if it stops matching `errors.html`'s own `sitemap.xml` `lastmod` (tested: reverting the text to "June 2026" correctly fails the build). Whoever edits `errors.html` again must bump both together.
- [x] `errors.html`: "authoritative" dropped; "Most-referenced fixes… this month" relabelled "Worth a look first" with no time-bound claim; added a scope paragraph explaining which categories are core/researched vs. closest to the author's own production work (Java/Kafka/Flink/PostgreSQL) vs. newer/documentation-based (Go/Rust) — consistent with `about.html`
- [x] `errors/nonetype-not-subscriptable.html`, `nonetype-no-attribute.html`: the 4 "JSON Formatter" / "Open JSON Formatter" links pointed at `index.html`; fixed to `formatter.html`. Grepped the other ~230 "JSON Dev Tools" bio-link and 5 other tool names sitewide for the same href/text mismatch — none found; this was isolated to those two files.

**Day 5 (Fri Sep 25): head hygiene**
*Code-side work done 2026-09-29. Nothing committed yet. **Not fully done:** the external post is still yours to publish.*
- [x] `scripts/check-meta-description.js` extended to root and `http-status/` (now defaults to `.` + `errors` + `blog` + `http-status`, 295 pages) and to titles. Hard-fails on description > 160 or title > 70; warns on description < 120 or title 61–70. Counts decoded glyphs, not bytes (`&mdash;` is one character), skips the two meta-refresh stubs, and fails on a missing `<title>`/description rather than silently passing.
- [x] All descriptions over 160 chars rewritten to 120–160 — **138**, not 137 (three pages added since the Sep 20 baseline): 20 root, 72 errors, 46 blog, 0 http-status. Error-page descriptions keep the exact error string and drop the trailing framework list; tool pages drop the "Free online X" preamble and lead with what the tool does.
- [x] **131** titles over 70 chars fixed (not 130 — same baseline drift): 7 root, 54 errors, 65 blog, 5 http-status. 103 were fixed by dropping the redundant `| JSON Dev Tools` suffix, which `ERROR_PAGE_GUIDE.md` already forbids on error pages; the other 28 were rewritten by hand, keeping the searchable error string and cutting the marketing tail.
- [x] Bonus: 37 more titles in the 61–70 band de-branded (free win, no copy change) — over-60 titles **204 → 94**. See the go/no-go note; the remaining 94 are mostly exact error strings and cannot reach 60 without breaking the match to what users search.
- [x] Bonus, found in passing: `blog/common-json-errors.html` carried a triple-mojibake sequence (`Ã¯Â¿Â½Ã¯Â¿Â½Ã¯Â¿Â½`, a double-encoded em-dash) in **both** its meta description and its Article JSON-LD `description`. Both fixed; a sitewide scan for that and two related mojibake patterns finds no others.
- [ ] First external post published (by you) — `docs/off-page/post-1-share-link-leak.md` was drafted on Day 2 and is still unpublished

**Day 6 (Sat Sep 26): experience capture (needs you, ~1–2 h)**
*Question list written 2026-10-01. **Blocked on you** — Days 8–11 cannot start until the notes come back.*
- [x] Question list for Kafka, Postgres, Java, Docker pages sent → **`docs/experience/day6-questions.md`**. 11 priority pages (4 Kafka, 3 Postgres, 2 Java, 2 Docker) plus 1 reserve, chosen by reading each page's existing `<h2>` outline first so every question targets a gap the page genuinely has rather than something already written. 2–4 questions per page, ~33 total, sized for the 1–2 h budget. Carries the five-beat answer template, a usable/not-usable example pair, and the two naming decisions needed up front (the anonymisation phrase, and a scale ceiling). Every number is to be marked `[sure]` / `[hazy]` / `[can check]` so the honesty rule is enforceable at drafting time.
- [x] Noted in the same doc: the stack includes **Flink** and the site has **zero** Flink pages — the strongest candidate for the next new page under the 1–2/week rule, and it reinforces the "data streaming" positioning `about.html` and the `errors.html` scope paragraph now both claim.
- [x] Your bullet notes received 2026-10-03 (anonymized; naming phrase agreed as *"a real-time train monitoring system"*)
- [x] **Outcome: 0 of 11 pages came back with a usable incident story.** Answered honestly — the recurring answer is "I don't have a confirmed incident and won't invent one," which is the honesty rule working exactly as intended. What did come back is real and `[sure]`-marked but **environment-shaped, not incident-shaped**: Flink 1.20.1, 12 TaskManagers × 6 slots = 72 slots, ~200 msg/s, Java 21 after a Java 11 → 21 upgrade, Docker/WSL at 12 GB / 8 CPUs / 16 GB swap, Kafka + Event Hubs integration, backpressure named as the strongest real area.
- [x] Round 2 follow-ups written into the same doc — six questions, narrowed to only the threads that already produced `[sure]` material, with the bar lowered from "production incident" to "something true the docs don't say." Highest-probability thread is the **Java 11 → 21 upgrade**, because `java-unsupportedclassversionerror.html` is already built on `class file version 65.0`, and 65.0 *is* Java 21.
- [ ] **You:** Round 2 answers (or an explicit "nothing there", which is a valid close)

**Day 7 (Sun Sep 27)**
*Done 2026-10-03. Day 7 work uncommitted; Days 1–6 are committed (through `acedce1`).*
- [x] Sitemap `lastmod` regenerated from real content changes → **`scripts/sitemap-lastmod.py`** (new, repeatable, `report` / `write` modes). Rule it implements, so it is auditable: **lastmod = the newest commit that changed the page's visible body**, ignoring `<head>`, the nav placeholder, the `<noscript>` fallback nav, the `<footer>`, `<script>` tags, the sitewide byline/`article-meta`/author-bio furniture, and the doctype/BOM. **206 of 293 entries changed** — 199 forward (the sitemap had never been updated as cross-links and References blocks accumulated), 7 back. Now **38 distinct dates, largest cluster 67** (the genuine 2026-08-16 "add references" commit), so the signal is real rather than one bulk date. Idempotent: a second run reports 0 changes.
- [x] Two false-positive classes caught and excluded, each verified against a real diff before trusting it: the **2026-06-12 commit added a BOM to 130 files** (would have read as 130 content edits), and the **Day 2 bulk byline change touched 242 pages** (`Software Developer` → `Senior Software Engineer, Data Streaming`). Neither is a content change. Without those exclusions the regeneration reported 274 changes instead of 206.
- [x] **Found and fixed 3 pages that claimed an update that never happened** — `blog/log-redactor-guide.html`, `blog/privacy-first-json-tools.html`, `errors/net-err-blocked-by-client.html` each displayed "Updated September 2026" *and* `"dateModified": "2026-09-12"` while their bodies had not changed since July, June and August respectively. On one of them the entire 2026-09-12 diff **was** the line adding "Updated September 2026". Visible label and schema both corrected to the real dates. This is the same class of unverifiable claim the hub cleanup removed on Day 3–4, and all 67 pages carrying an "Updated" label were checked — only these 3 were wrong.
- [x] Sitemap coverage verified in both directions: **0 orphan entries**, and the only 4 published pages absent from the sitemap are deliberately excluded (`404.html` and `http-status-flashcards.html` are noindex; the two `/blog/` legal URLs are meta-refresh stubs).
- [x] `python scripts/build_site.py` passes — 435 files, sitemap complete, no broken links, JSON-LD valid. `errors.html` kept a September lastmod (2026-09-24), so the build's lastmod-vs-"Last updated" check still holds.
- [x] **Security review of the Week-1 security surface — clean.** The `/security-review` harness only captured the uncommitted diff (date strings plus a read-only script), so the audit was done directly against the files §4 Day 1–3 actually changed. Traced the attacker-controllable share payload end to end: `#j=` → `LZString.decompressFromEncodedURIComponent` → textarea `.value` → `setOutput` → `pre.innerHTML`. **Not XSS:** `addSyntaxHighlight` (`js/formatter.js:144`) escapes `&`, `<` and `>` *before* wrapping tokens in spans, and the tree viewer builds nodes with `createElement`/`textContent`. **Share payloads also do not persist to a recipient's device:** the CM6 input is seeded through `EditorState.create`, which does not fire `updateListener`, and a programmatic textarea `.value` assignment fires no `input` event — so neither `localStorage.setItem('formatterInput', …)` path runs. `js/analytics.js` excludes the fragment and deletes `j` from the query. `js/consent.js` sets global-granted then region-denied with `wait_for_update`, and its region list is complete at 32 (**all EU 27 + IS/LI/NO + GB + CH**); it is a synchronous tag ahead of both the AdSense and GA loaders, which is the ordering Consent Mode requires. The one residual is already in §8: a legacy `?j=` link reaches the GitHub Pages server once before `history.replaceState` strips it.
- [x] Code review of the new script and the week's diff: no defects to fix. One robustness note recorded, not a bug: `js/codemirror-setup.js:160` retries `new EditorView` in a `catch` without clearing `inputContainer` first, so a mid-construction failure of the `json()` extension could leave two editors mounted. Rare path, cosmetic if hit.

### Week 2 (Sep 28–Oct 4): first-hand material, then polish

**Days 8–11 (Mon–Thu Sep 28–Oct 1)**
- [x] ~~First-hand sections on 8–12 pages, drafted from your notes~~ → **replaced with option B (§9), approved 2026-10-03: reproduced-and-captured sections, version pinned.** No invented incidents. Evidence log: **`docs/experience/reproduction-log.md`**.
  - **7 pages gained substantive verified sections** — 2 Postgres, 2 Java, 2 Docker, 1 Kafka. Runtimes: PostgreSQL 16.15, Java 21.0.11 (+ `eclipse-temurin:21-jre-alpine`), Docker 25.0.2, Apache Kafka 3.9.0.
  - **Three of the seven correct a factual error the page was already asserting**, which is the clearest evidence option B is worth more than an anecdote would have been:
    1. `java-concurrentmodificationexception.html` claimed *"in single-threaded code the exception is reliable enough to treat as a hard signal."* **False.** Removing the second-to-last element of an `ArrayList` in a for-each **never throws at any list size** and silently skips the final element (`hasNext()` is `cursor != size`, so the comodification check in `next()` is never reached). Failure mode is wrong output, not an exception.
    2. `kafka-offsetoutofrange.html` claimed `CURRENT-OFFSET` below `LOG-END-OFFSET` means *"the consumer is behind but its position is still valid."* **False in exactly the case the page is about.** `kafka-consumer-groups.sh` computes `LAG = LOG-END − CURRENT` and never consults the log *start* offset — it reported `LAG 15` for a committed offset that no longer existed, when 7 records were already unrecoverable. Added the `--time -2` comparison, which the page never mentioned.
    3. `postgres-too-many-clients.html` FAQ claimed regular users see *"too many clients already"* once non-reserved slots fill. **They see a different message:** `remaining connection slots are reserved for roles with the SUPERUSER attribute`. Corrected in **both** the visible `<details>` and the `FAQPage` JSON-LD (parity held at 6:6).
  - New findings on the other four: **exit 137 and `OOMKilled` are orthogonal in both directions** (a child OOM-kill exits **0** with `OOMKilled=true`, so the exit code can read "not memory" when it was); **deadlock victim selection is a `deadlock_timeout` race**, so neither transaction can be designated "the one that gets retried"; the container-aware JVM default is **`MaxRAMPercentage=25`** and an explicit `-Xmx` **overrides** container awareness (a Java stack trace vs. a silent 137 is the discriminator); `ENOSPC` **leaves a truncated file behind**, and the capitalised coreutils wording differs from Docker's lowercase one.
  - **Not done, stated plainly:** `kafka-commitfailedexception.html` was attempted twice and **not reproduced** — the shipped console consumer will not stall its poll loop on demand (the OS pipe buffer absorbs the backpressure). It needs a purpose-built consumer, roughly an hour. `postgres-current-transaction-is-aborted.html` was re-verified and **needed nothing**: it already states that `SET`, `SHOW`, `RESET`, `SET TRANSACTION`, `SAVEPOINT` and `RELEASE SAVEPOINT` are all rejected, and already carries a 16.15 pin. Adding a section there would have been padding. **So the count is 7 substantive + 1 independently re-verified, against a target of 8 — see §9 for whether that clears the gate.**
  - Plumbing: added `.verified-note` to `css/blog.css` (light + dark), bumped `dateModified` to 2026-10-03 on all 7, added the heading `id`s the new cross-links needed. Caught in passing: **57 error pages are missing the `"image"` property in their Article schema**, which `ERROR_PAGE_GUIDE.md` §3 makes mandatory and records as a previously-backfilled gap. Fixed on the one page I edited; **the other 56 are untouched and need a decision** (mechanical backfill of `https://jsondevtools.org/og-image.png`).
- [ ] 5–6 topic-specific author bios replace the verbatim bio (242 pages, 2 variants)
- [ ] Visible "Last updated" next to "Published" (only where `dateModified` is real)
- [ ] Boilerplate CTAs varied
- [ ] Merge `blog/json-unexpected-end-input.html` and `fetch-unexpected-end-json-input.html` (canonical to the stronger, out of sitemap)
- [ ] Cross-link and differentiate: 5 chmod posts, 3 CORS pages, 3 Python trailing-data pages
- [ ] `http-status-flashcards.html`: about 400 words of explanatory text, or noindex without ads
- [ ] 6 thinnest tool pages checked for worked-example and edge-case sections (`url-encoder`, `uuid`, `regex-tester`, `cron`, `jwt-decoder`, `jwt-encoder`)

**Day 12 (Fri Oct 2): accessibility and polish**
- [ ] Skip link; `<main>` on the 5 pages without it
- [ ] 29 unlabeled inputs across 17 tool pages labeled
- [ ] `:focus-visible` styles; `outline:none` removed on 11 files
- [ ] White-on-`#28a745` button contrast fixed (124 pages); heading skips (18 pages); 2 missing `alt`s

**Day 13 (Sat Oct 3)**
- [ ] `PHASE_7_PROPOSAL.md` status block records the 1–2 pages a week rule

**Day 14 (Sun Oct 4): final audit and go/no-go**
- [ ] `python scripts/build_site.py` passes
- [ ] Sep 20 audits re-run and compared with the table in section 5
- [ ] Search Console → Pages: "Discovered – not indexed" count recorded (baseline 85)
- [ ] `node scripts/indexnow-submit.mjs` for changed URLs; indexing requested for the hubs

### Soak (Oct 5–19)
- [ ] Weekly Search Console check (Oct 5, Oct 12, Oct 19); `build_site.py` re-run after any change
- [ ] No sitewide edits after Oct 12; at most 1–2 new pages a week
- [ ] External mentions/links logged with URLs (target: at least 3)
- [ ] Oct 18 AdSense pre-flight: correct domain (apex vs www, matches `CNAME`), `ads.txt` Authorized, GDPR message published, payment and contact details complete
- [ ] Oct 19 final go/no-go
- [ ] **Oct 20: apply**

## 5. Go/no-go table (pass by Oct 4, re-check Oct 19)

| Gate | Target | Baseline (Sep 20) |
|---|---|---|
| Pasted JSON reachable via URL query string | none (fragment only; legacy `?j=` stripped, not sent to GA4) | `?j=` in query |
| Input-caching statement consistent on privacy, homepage, formatter | yes | contradicts |
| Privacy/Terms at root, stubs at old URLs, all footers updated | yes | under `/blog/` |
| Privacy meta description, GDPR section, real revision date | yes | none / none / application day |
| About/Contact/Terms/Privacy contradictions | 0 | 5+ |
| Byline and About reflect real role and stack | yes | "Software Developer" |
| `errors.html` count matches its own table, real date matches its own sitemap entry, no unverifiable claims, scope statement | yes — **done 2026-09-22** | "0", June 2026, 2 claims, none |
| ~~Kafka/Postgres/Java/Docker pages with a first-hand section~~ → **reproduced-and-captured section, version pinned** (option B, approved 2026-10-03) | at least 8 — **at 7 substantive + 1 re-verified**, 2026-10-03 | 0 |
| Error pages missing `"image"` in Article schema (guide §3 requires it) | 0 | **57 found 2026-10-03**, 1 fixed, 56 open |
| Invalid JSON-LD blocks | 0 (enforced by build) | 8 blocks in 4 files |
| Meta descriptions over 160 chars | 0 — **done 2026-09-29** | 137 (really 138) |
| Titles over 70 / over 60 | 0 — **done 2026-09-29** / under 40 — **not met, at 94** | 130 / 201 (really 131 / 204) |
| CMP live and GA4 consent-gated | yes | site code live 2026-09-22; message created, serves only after approval |
| Ad loader on non-content pages | 0 | 2 |
| Placeholder slot / test scripts published | 0 | 1 slot, 2 scripts |
| Author bio verbatim duplicates | under 30 pages per variant | 242 pages, 2 variants |
| External mentions/links to the site | at least 3 | none recorded |
| `python scripts/build_site.py` | passes | passes |

## 6. Verification

- `python scripts/build_site.py` passes after each day's changes (sitemap complete, no broken links, JSON-LD valid, no dev files, hub count matches).
- Share link, in a browser: format JSON, click Share, confirm `#j=`. Open a legacy `?j=` link, confirm the query is stripped and no `j=` value appears in outgoing GA4 requests (network log).
- Consent test on `formatter.html` and one error page, accepted and declined: GA4 and ads load only after consent in EEA mode.
- `node scripts/check-meta-description.js` (no arguments) reports 0 **failures** across root, errors, blog and `http-status` — that now covers over-length titles as well as descriptions. Warnings are expected and non-blocking: 94 titles in the 61–70 band and 5 descriptions under 120 chars.
- `errors.html` with JavaScript disabled shows the right count and date.
- Word-count and bio-duplication scripts re-run on Day 14 with the same method as the Sep 20 audits.
- Search Console: Pages report; Rich results test on the 4 fixed blog pages; URL inspection on the moved Privacy/Terms URLs.
- AdSense console: `ads.txt` status and GDPR message state.

## 7. Progress log

| Date | What changed | Notes / numbers |
|---|---|---|
| 2026-09-20 | Plan written and approved | Baselines above. |
| 2026-09-20 | Day 1 changes (see checklist) | `python scripts/build_site.py` passes, 426 files. Share link verified in a browser: new links use `#j=`, a legacy `?j=&x=1` link loads the JSON and the address bar becomes `?x=1`, and the `gtag('config')` call carries no `j=` value or fragment. Not committed. |
| 2026-09-21 | Day 2 changes (see checklist) | `python scripts/build_site.py` passes, 428 files (two new root pages). Not committed. **Do not deploy Day 2 on its own:** Privacy section 6 says analytics/advertising cookies are set only after consent in the EEA/UK/Switzerland, which is true only once the Day 3-4 consent message is live. |
| 2026-09-21 | New first-hand post: `blog/vue-echarts-large-dataset-slider-lag.html` (counts toward the 1-2 pages/week) | Story from the author's real fix (Options API, 2.4 MB dataset, markRaw/toRaw). All numbers are from a local reproduction (Vue 3.5.43, ECharts 6.1.0) and labelled as such in the post. Added to blog index and sitemap. Not committed. |
| 2026-09-22 | Days 3-4 code-side changes (see checklist), two days early | `python scripts/build_site.py` passes, 432 files. Not committed. **Still open:** publishing the GDPR message in the AdSense console — nothing the code does can substitute for that. Two new build-time checks added (errCount vs. table, "Last updated" vs. sitemap lastmod) and both verified to actually fail on injected drift, then reverted. |
| 2026-10-03 | Day 7: sitemap `lastmod` regenerated honestly; Week-1 security review | `build_site.py` passes (435 files). New `scripts/sitemap-lastmod.py` derives lastmod from body-content changes only; 206/293 entries corrected, 38 distinct dates, idempotent on re-run. Excluded two false-positive classes after checking the actual diffs: a BOM added to 130 files on 2026-06-12, and the 242-page byline change on Day 2. **Fixed 3 pages that displayed "Updated September 2026" with no content change behind it** (one page's whole 09-12 diff was the line adding that label). Sitemap coverage clean both ways. Security review of the share-link/consent/analytics surface found **no exploitable issue** — the share payload reaches `innerHTML` but is escaped before token wrapping, and it never persists to a recipient's `localStorage`. Not committed. |
| 2026-10-03 | Option B executed: 7 error pages gained reproduced-and-captured sections | `build_site.py` passes, 435 files; `check-meta-description.js` still 0 failures; per-page checks pass on all 7 (one `<h1>`, valid JSON-LD, FAQ parity, Article image, no broken links or anchors, References block). Evidence in `docs/experience/reproduction-log.md`. **Three pages had a factually wrong claim corrected** (CME single-threaded reliability, Kafka `LAG` validity, Postgres reserved-slot message). Two reproductions also corrected *my own* first reading before anything shipped — deadlock victim selection is a timer race, not "oldest transaction loses". Not committed. **Open:** `kafka-commitfailedexception.html` not reproduced (needs a real consumer), and 56 error pages still missing their Article schema `"image"`. |
| 2026-10-03 | Day 6 notes received and read; Round 2 follow-ups written | **0 of 11 pages have an incident story** — answered honestly, and the honesty rule makes that binding rather than negotiable. Real `[sure]` material is environment-shaped: Flink 1.20.1, 72 slots (12 TM × 6), ~200 msg/s, Java 21 after an 11 → 21 upgrade, Docker/WSL 12 GB / 8 CPUs / 16 GB swap, Kafka + Event Hubs. **The first-hand gate is unreachable as written — see the new §9 for the decision.** No site files touched. Also confirmed while checking: the site names Flink in the author's stack on `about.html`, `index.html` and `errors.html` but has 0 Flink and 0 Event Hubs pages, which is both the credibility gap and the opening. |
| 2026-10-01 | Day 6 question list written → `docs/experience/day6-questions.md` | No site files touched; `build_site.py` unaffected (435 files, `*.md` skipped). **This is now the critical path.** Days 8–11 are specified as "drafted from your notes", so they are blocked until the notes come back — and the first-hand sections are the one go/no-go gate still at 0 (target: at least 8 pages). The 11 pages are already picked and their existing coverage inventoried, so drafting can start the same day the answers land. |
| 2026-09-29 | Day 5 head hygiene (see checklist) | `python scripts/build_site.py` passes, 435 files. `node scripts/check-meta-description.js` reports **0 failures** across all 295 pages, down from 269 (138 descriptions + 131 titles). 213 files changed. Not committed. Titles are **not** duplicated anywhere after de-branding — checked all 296 source pages, 0 collisions. Only `<title>` and `<meta name="description">` were touched; `og:title`/`og:description` were left alone because they are already written independently on almost every page (verified on a sample before starting), so syncing them would have overwritten deliberate social copy. |

**Day 1 audit results**
- Persisted user input: only the formatter's `formatterInput` (`js/app.js:107`, `js/codemirror-setup.js:137`). `jsonHistory` in `js/utils.js` is dead code: `js/app-enhanced.js` is not loaded by any page. Other localStorage keys are settings (dark mode, toggles, `pxRemBase`, quiz state) and the mock-data field model. The privacy text can therefore say "the formatter saves what you type in this browser".
- Query strings: `getQueryParam` is only read (`?q=` on the error-log analyzer, `?mode=` on the mock-data generator); `setQueryParam` has no callers. No other tool writes user data into the URL.
- The technical audit's "8 invalid JSON-LD blocks" were 4 files x 2 blocks whose script tags themselves had curly quotes; a robust rescan of all 293 pages now finds 0 problems.
- Deferred to Days 3-4: the `js/analytics.js` script tag in `<head>` is not `defer`.

**AdSense rejection reason (pasted 2026-09-20):**
> We found some policy violations. Make sure your site follows the AdSense Program Policies. After you've fixed the violation, you can request a review of your site.
> **Low value content.** Maintaining a healthy and trusted ad ecosystem requires our partners to meet clear quality and operational standards. To qualify for ad serving, a site must provide substantial unique value, establish a consistent presence on the web, and show a level of user interest that supports a commercial advertising partnership. Before re-submitting your site, ensure that it:
> - Provides authentic, high-quality information, tools, or services.
> - Exhibits ongoing curation and structural maintenance.
> - Generates and sustains genuine user interest.
> Resources cited: Google AdSense content and user experience; Google's spam policies for thin content; Spam policies for Google web search.

**How the plan maps to the three criteria**
- *Authentic, high-quality information, tools, services:* trust-page truth pass, privacy fixes, first-hand material on Kafka/Postgres/Java/Docker pages (Week 1-2).
- *Ongoing curation and structural maintenance:* JSON-LD guard in the build, honest `lastmod`, hub count/date checks, fixed meta lengths, accessibility, merged duplicates. The 1-2 pages a week rule shows curation rather than bulk publishing.
- *Genuine user interest:* this is the one the code cannot fix. Traffic was about 811 sessions/month in July. The external-signal track (posts, mentions), the Search Console indexing numbers and the Oct 5-19 soak are the levers. Record the Search Console trend below.

**Search Console snapshots (fill in):**
- Oct 4: 
- Oct 12: 
- Oct 19: 

## 8. Caveats

- Approval is not guaranteed. The July audit also cites thin engagement and no third-party authority. This plan improves both, but traffic accrues slowly.
- GitHub Pages cannot send 301s or security headers, so redirects are meta-refresh stubs and merges use canonical tags. Legacy `?j=` share links already in the wild will hit the server once before they are stripped.
- Steps that need the author: AdSense console (rejection reason, GDPR message, pre-flight), the Day 6 experience notes, confirming the job title, publishing the external posts, and confirming any "reproduced on" claim.

## 9. Open decision: the first-hand gate (raised 2026-10-03)

The Day 6 notes came back honest and empty of incidents: **0 of 11 pages** have a story. The plan's own honesty rule then settles what *cannot* happen — no invented production passages, and no page gets a first-hand section it has no material for. So the gate "at least 8 pages with a first-hand section" is not behind schedule, it is **unreachable as specified**, and leaving it in the table at 0 would be the one dishonest line in this document.

Three options. **A and B are not exclusive and the recommendation is both.**

**A. Build the one page the notes genuinely support — Flink backpressure/resources.** *Recommended.*
The notes contain a real, specific, `[sure]`-marked operating envelope: Flink 1.20.1, 12 TaskManagers × 6 slots = 72 slots, ~200 msg/s, Java 21, inside Docker/WSL at 12 GB / 8 CPUs / 16 GB swap. That is first-hand without being an incident — it is a topology and a resource envelope the author actually ran. It is also the site's largest credibility gap: `about.html`, `index.html` and `errors.html` all name Flink in the author's stack, and the library has **0 Flink pages and 0 Event Hubs pages**. One honest Flink page is worth more to the "substantial unique value" criterion than eight thin retrofits, and it satisfies the 1–2 new pages a week rule at the same time.
*Note the striking ratio to build the page around:* ~200 msg/s against 72 slots is **low**, so the parallelism was driven by something other than throughput. If Round 2 (question C) names what — partitions, state size, key skew, per-record cost — that is a genuinely publishable insight, because sizing advice elsewhere assumes throughput is the driver.

**B. Replace the gate with one the work can actually clear: depth verified by execution.**
Substitute *verified by reproduction* for *first-hand incident*. This is already what the site does better than its competitors — `importerror-cannot-import-name-circular-import.html` was verified across CPython 3.7/3.8/3.12/3.13/3.14 and corrected two widely-repeated wrong fixes, which no amount of anecdote would have achieved. It needs no author memory, it is auditable, and `ERROR_PAGE_GUIDE.md` §9b already codifies it. Proposed replacement gate: **at least 8 of the 11 Kafka/Postgres/Java/Docker pages carry a reproduced-and-captured section with the version stated.** Kafka, Postgres and Docker all run in containers, so this is executable.

**C. Drop the gate and ship without it.** Honest, but it gives up the strongest available answer to the rejection's "substantial unique value" wording. Only take C if Round 2 comes back empty *and* there is no appetite for B.

### Outcome of option B (2026-10-03)

Chosen and executed. **7 pages carry substantive verified sections; 1 more (`postgres-current-transaction-is-aborted.html`) was independently re-verified and already compliant.** Against the proposed "at least 8" that is 7 substantive, and the honest reading is:

- If the gate means *8 pages improved by reproduction*, it is **not met** — one short. The missing one is `kafka-commitfailedexception.html`, which needs a purpose-built consumer (~1 h) because the console consumer cannot be made to stall its poll loop.
- If it means *8 pages whose claims are verified against a stated runtime*, it **is met**, since the 8th was re-run and already stated its version.

**Recommendation: count it as met and spend the hour elsewhere.** Three of the seven pages had a *factually wrong claim corrected* — that is a materially better outcome than a count of eight, and it is the kind of thing a reviewer assessing "substantial unique value" can actually verify. The remaining budget is better spent on the 56 pages missing their Article schema image (a guide-mandated gap, mechanical, affects rich results) than on an eighth reproduction.

**`about.html` wording check, still outstanding.** It may keep saying the author is a senior engineer in Java, Kafka, Flink and PostgreSQL — true and confirmed. It must not imply the error pages are written from production incidents; under option B the honest framing is **"verified against real runtimes"**. Confirm the current wording before Oct 20.

**Consequence for `about.html` either way:** it may keep saying the author is a senior engineer working in Java, Kafka, Flink and PostgreSQL — that is true and confirmed. It must **not** drift toward implying the error pages are written from production incidents if they are not. Under option B the honest framing is "verified against real runtimes", not "from my production experience". Check the wording before Oct 20.
