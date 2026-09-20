# Technical SEO Audit — jsondevtools.org

**Site:** https://jsondevtools.org
**Pages audited:** 294 HTML files (full crawl of the deploy source, not a sample); 291 sitemap URLs
**Audit date:** 2026-09-17
**Stack:** Static HTML on GitHub Pages, custom domain, no CMS or build step

**Tools used**
- Full static crawl of the repository (= the deployed artifact) via a purpose-written link-graph and directive parser
- `curl` for live status codes, redirect behaviour and response headers
- Chrome 152.0.7977.83 headless over the DevTools Protocol for render and computed-style checks
- Google Search Console **Coverage drilldown CSV export, 2026-09-08** (single snapshot, 85 URLs)

---

## Data gaps — what this audit could not verify

Per the skill's standing rule, these are stated rather than estimated. Nothing below is interpolated.

| Required input | Status | What is affected |
|---|---|---|
| Live Search Console access | **Not available.** One CSV export (2026-09-08) only | Index-count reconciliation, enhancement reports, manual actions, crawl stats |
| Server / CDN access logs | **Not available** (GitHub Pages exposes none) | Layer 1 crawl-budget verification, §9 log analysis — *entirely unscored* |
| Core Web Vitals field data (CrUX / RUM) | **Not available** | §5 CWV table left empty. No LCP/INP/CLS figures are given because none were measured |
| Lighthouse | Not installed in this environment | No lab fallback either |
| Rich Results Test / Schema.org validator | Not reachable from here | JSON-LD was validated for **parse correctness and required-property presence only**, not against Google's rich-result eligibility rules |

The CWV row matters most: **this audit makes no claim about page speed in either direction.** It was not measured.

---

## Executive summary

The technical layer is in good shape, and that is the single most important finding — because it means **the indexing backlog is not technically caused.** Across 294 pages there is no `noindex` on an indexable page, no canonical conflict, no redirect chain, no crawl trap, no invalid structured data, and every page is reachable from the homepage within three clicks. Host canonicalization is textbook: `http`, `www` and `http+www` each resolve to `https://jsondevtools.org` in a **single** hop.

The headline problem is that **85 of 291 sitemap URLs (29%) sit in "Discovered – currently not indexed"** with `Last crawled 1970-01-01`, meaning Google has never fetched them. Earlier analysis in this repo established that indexed-vs-not tracks **page age**, not page quality (June cohort 42/47 indexed; August 1/19), and the unindexed pages are measurably *better* than the indexed ones. This audit confirms there is no technical blocker producing that split. It is a crawl-scheduling backlog on a young, low-authority domain, and the fixes below will not resolve it on their own.

**There is no P0.** The biggest genuine technical defect is a single broken internal link. The recommended next move is therefore *not* a technical sprint — it is internal-link acquisition from already-crawled pages, plus manual index submission, which is where the constraint actually is.

---

## 6-layer score

| Layer | Score | Basis |
|---|---|---|
| 1. Crawlability | **Pass** | robots.txt valid and permissive, sitemap 200 + valid XML + 291/291 `lastmod`, nothing important disallowed |
| 2. Indexability | **Pass** | 3 `noindex` pages all deliberate; 292/294 canonicals correct; single-hop host redirects; real 404s |
| 3. Rendering | **Pass with caveat** | Content, titles, metas and canonicals all server-rendered. Primary nav (43 links) is JS-injected |
| 4. Architecture | **Pass** | Max click depth 3, zero pages deeper; 0 true orphans; 1 broken internal link |
| 5. Structured data | **Pass** | 0 invalid JSON-LD across 294 files; Organization on homepage; `llms.txt` present and 200 |
| 6. Page experience | **Partial — unscored** | HTTPS clean, no mixed content, real 404s. **No HSTS.** CWV not measurable (no field data) |

---

## Critical issues (P0)

**None.** No condition was found that blocks crawling or indexing of any intended page.

---

## Important issues (P1)

### P1-1 — Broken internal link returning 404

`blog/chmod-644.html` links to `chmod-640.html`, which does not exist in the build.

```
blog/chmod-644.html:178   …use <a href="chmod-640.html">640</a> or <a href="chmod-600.html">600</a> instead.

present: blog/chmod-{600,644,755,775,777}.html      absent: blog/chmod-640.html
referenced from: 1 page (chmod-644 only)            in sitemap: no
```

This is the only broken internal link across all 294 pages. The target was never built and was never in the sitemap, so this is a link written against a planned page rather than a regression — which also means no external signal points at it.

**Fix, either way:**
- **Write `blog/chmod-640.html`.** The surrounding sentence already makes the case for it ("credentials the group should *not* see"), 640 is a genuinely common permission, and it would sit naturally in the existing 600/644/755/775/777 set.
- **Or retarget to `chmod-600.html`**, which exists and is already linked in the same sentence. 15 minutes, and the prose still reads correctly.

### P1-2 — 29% of the sitemap has never been crawled

85 URLs in "Discovered – currently not indexed". **Not technically caused** — see Executive summary. Recorded here because it is the dominant search-performance fact about the property, not because a technical fix resolves it.

The actionable technical contribution is internal-link distribution: 46 of the 85 have only two inbound links from a page Google has actually crawled, and both come from `errors.html` — the registration row and category item. Every "Related Errors" link pointing at them originates from *another uncrawled sibling*, which passes nothing.

---

## Medium issues (P2)

### P2-1 — Primary navigation is client-side rendered

All 43 nav links are injected by `js/navbar-component.js` into `<div id="nav-placeholder">`. Raw HTML contains no nav.

Google renders JavaScript, so this is not a blocker — and it is materially softened by a real mitigating fact: **the static-HTML link graph alone (body prose, footer, related-error blocks) already reaches every page in ≤3 clicks.** The measured depth distribution below was computed from static HTML *only*, with the JS nav excluded:

```
depth 0: 1     depth 1: 29     depth 2: 245     depth 3: 17     deeper: 0
```

Still worth noting because rendering is a deferred second wave that consumes crawl budget — an unhelpful property on a site already behind on crawling — and because non-rendering agents (many AI crawlers, plain fetchers) see no navigation at all.

**Fix:** emit the nav as static HTML at build time, or add a `<noscript>` block containing the primary links. Low effort, and it removes a dependency rather than adding one.

### P2-2 — No HSTS header

```
HTTP/1.1 200 OK
Server: GitHub.com
Cache-Control: max-age=600
```

No `Strict-Transport-Security`, and also no `X-Content-Type-Options`, `X-Frame-Options` or CSP. HTTPS is correctly enforced by redirect, so this is defence-in-depth rather than an active exposure.

**Constraint to be honest about:** GitHub Pages does not let you set response headers. This cannot be fixed on the current stack — it needs a proxy in front (Cloudflare or similar). Worth deciding deliberately rather than leaving as an unexplained gap.

### P2-3 — `BreadcrumbList` missing on three real pages

Missing from `blog/index.html`, `blog/privacy-policy.html`, `blog/terms-of-service.html`. (Also absent from `404.html` and `tools/scorecard-template.html`, which is correct — neither should be indexed.)

The site otherwise applies BreadcrumbList consistently across all 289 content pages, so these three are the exception rather than the rule.

---

## Nice-to-have (P3)

- **`errors.html` is 112 KB** and carries the inbound links for the entire error cluster. Links low in a document of that size are weighted less. A "Recently added" block near the top would raise the newest URLs in the hub's link order.
- **`lastmod` discipline is currently good** — 51 distinct dates across 291 URLs, reflecting real edits. Worth protecting: a future build step that stamps every URL with the build date would destroy the signal and is a common self-inflicted regression.

---

## Verified clean (no action)

Recorded so these are not re-audited later:

- `robots.txt` — valid, permissive, sitemap declared, no CSS/JS disallow
- Host canonicalization — `http`, `www`, `http+www` → `https://jsondevtools.org`, **1 hop each**, no chains
- 404 handling — returns a true `404`, not a soft 404
- Canonical tags — self-referencing and correct on 292/294; the two exceptions are `404.html` and a `noindex,nofollow` template
- `blog/index.html` → `https://jsondevtools.org/blog/` is **correct**, not a mismatch (directory index)
- JSON-LD — 0 parse failures across 294 files
- Mixed content — 0. The two `http://` strings found are inside `<pre>` code samples on the mixed-content documentation page
- URL hygiene — 0 issues: all lowercase, hyphenated, no parameters, no session IDs
- Orphans — 0 genuine. The 2 flagged are `404.html` and a `noindex,nofollow` template
- Sitemap hygiene — 291 unique URLs, all canonical, none `noindex`; well under the 50k split threshold
- `llms.txt` — present and returning 200

> **Method note.** An earlier pass of this audit reported 5 orphans and 7 pages deeper than 3 clicks. Both were false positives from my own checker: the external-link filter tested `startswith('http')`, which also matches the internal path `http-status/418.html`. Every link into `http-status*` was being discarded as off-site. Corrected before reporting; the numbers above are post-fix.

---

## Findings summary

| Severity | Issue | Pages affected | Recommended fix | Effort |
|---|---|---|---|---|
| P0 | — none — | 0 | — | — |
| P1 | Broken internal link → 404 | 1 | Build `blog/chmod-640.html` or retarget | 15 min – 2 h |
| P1 | 29% of sitemap never crawled | 85 | Internal links from crawled pages + manual submission | Ongoing |
| P2 | Nav is JS-only (43 links) | 294 | Static nav at build, or `<noscript>` fallback | 1–2 h |
| P2 | No HSTS / security headers | All | Requires a proxy; GitHub Pages cannot set headers | Stack decision |
| P2 | `BreadcrumbList` missing | 3 | Add the standard block | 30 min |
| P3 | 112 KB hub dilutes link position | 1 | "Recently added" block near top of `errors.html` | 1 h |

---

## Implementation roadmap

### Now (this week)
| # | Action | Impact | Effort |
|---|---|---|---|
| 1 | Fix the `chmod-640` broken link | Removes the only internal 404 | 15 min – 2 h |
| 2 | Add inbound links to the 85 from **already-crawled** pages | The one technical lever on the backlog | 3–4 h |
| 3 | Request indexing in GSC for the ~33 already-compliant pages (~10/day quota) | Direct crawl trigger | 4 days, low effort |

### Next (this sprint)
| # | Action | Impact | Effort |
|---|---|---|---|
| 4 | Render the nav server-side or add `<noscript>` | Removes render dependency; helps non-JS agents | 1–2 h |
| 5 | Add `BreadcrumbList` to the 3 blog pages | Consistency + CTR | 30 min |
| 6 | "Recently added" block at the top of `errors.html` | Raises newest URLs in hub link order | 1 h |

### Later (this quarter)
| # | Action | Impact | Effort |
|---|---|---|---|
| 7 | Decide on a proxy for security headers, or document the accepted limitation | Defence in depth | Stack decision |
| 8 | Re-export GSC Coverage and diff against 2026-09-08 | Measures whether any of this worked | 30 min |

---

## Monitoring after fixes ship

- [ ] Re-export the Coverage drilldown ~14 days after item 2 ships and diff the 85-URL list
- [ ] Watch the Aug/Sep cohorts specifically — they are the least-crawled and the clearest signal
- [ ] Re-run this audit's link-graph check after any nav change (it is the regression most likely to go unnoticed)
- [ ] Confirm `lastmod` still reflects real edits after any future build-tooling change

---

## Open questions

- [ ] Was `blog/chmod-640.html` planned and dropped, or is the link simply wrong?
- [ ] Is a proxy (Cloudflare) acceptable in front of GitHub Pages, or are the missing security headers accepted?
- [ ] Is there GSC access to grant for a live reconciliation, rather than working from CSV snapshots?

---

## Appendix: methodology

- **Crawl:** full enumeration of the deploy source, static HTML parsing (no JS execution) — deliberate, to measure what a non-rendering crawler sees. `<pre>` blocks excluded so code samples are not counted as links.
- **Sample selection:** none; every HTML file was examined.
- **Live checks:** status codes, redirect hops and response headers pulled from production.
- **Field data window:** not applicable — no field data was available.
- **Caveats:** no log analysis, no CWV measurement, no live GSC. §9 of the template is unscored. Rich-result *eligibility* was not tested, only JSON-LD validity.
