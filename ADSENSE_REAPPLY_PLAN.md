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
- [ ] **You:** set up and publish a GDPR message in AdSense → Privacy & messaging (Funding Choices); verify availability on a not-yet-approved account, else another certified CMP
- [ ] CMP snippet added site-wide via the shared nav/header script
- [ ] GA4 gated by Consent Mode v2 (default denied for EEA/UK); `defer` on the analytics script tag
- [ ] Terms rewritten in plain language to match the Privacy Policy
- [ ] `errors.html`: count baked into static HTML; `build_site.py` check fails if it differs from the number of `errors/*.html`
- [ ] `errors.html`: real "Last updated" date (same check) or removed
- [ ] `errors.html`: "authoritative" dropped; "Most-referenced… this month" removed or relabelled as an editor's pick
- [ ] `errors.html`: scope statement added
- [ ] `errors/nonetype-not-subscriptable.html`, `nonetype-no-attribute.html`: formatter links point to `formatter.html`; rest of the site grepped for the same mismatch

**Day 5 (Fri Sep 25): head hygiene**
- [ ] `scripts/check-meta-description.js` extended to root and `http-status/`, and to titles
- [ ] All 137 descriptions over 160 chars rewritten to 120–160
- [ ] 130 titles over 70 chars fixed (over-60 titles are a stretch; the build warns, does not fail)
- [ ] First external post published (by you)

**Day 6 (Sat Sep 26): experience capture (needs you, ~1–2 h)**
- [ ] Question list for Kafka, Postgres, Java, Docker pages sent
- [ ] Your bullet notes received (anonymized: no employer, client or system names)

**Day 7 (Sun Sep 27)**
- [ ] Sitemap `lastmod` regenerated from real content changes (not the bulk noscript commit)
- [ ] Week-1 `/code-review` + `/security-review`; `python scripts/build_site.py` passes

### Week 2 (Sep 28–Oct 4): first-hand material, then polish

**Days 8–11 (Mon–Thu Sep 28–Oct 1)**
- [ ] First-hand sections on 8–12 pages: Kafka (`errors/kafka-*`), Postgres, Java, Docker; drafted from your notes, reviewed by you
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
| `errors.html` static count equals `errors/*.html`, real date, no unverifiable claims, scope statement | yes | "0", June 2026, 2 claims, none |
| Kafka/Postgres/Java/Docker pages with a first-hand section | at least 8 | 0 |
| Invalid JSON-LD blocks | 0 (enforced by build) | 8 blocks in 4 files |
| Meta descriptions over 160 chars | 0 | 137 |
| Titles over 70 / over 60 | 0 / under 40 | 130 / 201 |
| CMP live and GA4 consent-gated | yes | none |
| Ad loader on non-content pages | 0 | 2 |
| Placeholder slot / test scripts published | 0 | 1 slot, 2 scripts |
| Author bio verbatim duplicates | under 30 pages per variant | 242 pages, 2 variants |
| External mentions/links to the site | at least 3 | none recorded |
| `python scripts/build_site.py` | passes | passes |

## 6. Verification

- `python scripts/build_site.py` passes after each day's changes (sitemap complete, no broken links, JSON-LD valid, no dev files, hub count matches).
- Share link, in a browser: format JSON, click Share, confirm `#j=`. Open a legacy `?j=` link, confirm the query is stripped and no `j=` value appears in outgoing GA4 requests (network log).
- Consent test on `formatter.html` and one error page, accepted and declined: GA4 and ads load only after consent in EEA mode.
- `node scripts/check-meta-description.js` reports 0 over-length descriptions across errors, blog, root and `http-status`.
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
