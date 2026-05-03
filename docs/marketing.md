# Marketing Execution Plan — Developer Tools Hub

Target: 20,000 monthly visitors in 3 months  
Realistic aggressive target: 6,000–12,000/month (based on competition analysis)  
Current baseline: ~300 sessions/month

---

## Section 1 — Tool Directory Submissions

Submit the site to all directories below within the first week. Most are free. Lead with the homepage URL and the JSON Formatter as the featured tool.

**Submission URL:** `https://pasindu98ishan.github.io/json-formatter/`  
**Tagline to use:** "Free online developer tools — JSON formatter, URL encoder, Base64, and timestamp converter. 100% browser-based, no signup required."

| Directory | URL | Notes |
|---|---|---|
| Product Hunt | producthunt.com/posts/new | Full launch — see Section 5 |
| Hacker News | news.ycombinator.com/submit | "Show HN" post — see Section 6 |
| AlternativeTo | alternativeto.net | Add as alternative to jsonformatter.org |
| ToolHunt | toolhunt.net | Developer tools directory |
| Dev Resources | devresourc.es | Curated dev tools list |
| Uneed | uneed.best | Weekly featured tools |
| Fazier | fazier.com | Tool launches |
| Tiny Tools | tinytools.directory | Focused dev utilities |
| StartupBuffer | startupbuffer.com | Free listings |
| Free for Dev | github.com/jnv/lists | Submit to awesome-free-tools lists |
| StackShare | stackshare.io | List as JSON tool stack |
| SaaSHub | saashub.com | Free tools category |
| BetaList | betalist.com | Early product submissions |
| reddit r/webdev wiki | reddit.com/r/webdev/wiki | Ask mod to add to resources |
| CSS-Tricks | css-tricks.com/almanac | Community submissions |

---

## Section 2 — Long-Tail Content Pages to Create

Targeting keywords with 50–500 monthly searches, low competition. Each page should be 400–800 words with an embedded working tool or a link directly to the relevant tool.

### Group A — JSON Error Pages (create 10 pages)
Each targets a specific error message developers search for. Template: explain the error, show example, embed validator link.

1. `blog/json-error-unexpected-token.html` — "Unexpected token < in JSON"
2. `blog/json-error-unexpected-end-of-json.html` — "Unexpected end of JSON input"
3. `blog/json-error-trailing-comma.html` — "JSON trailing comma not allowed"
4. `blog/json-error-missing-comma.html` — "JSON missing comma between values"
5. `blog/json-error-single-quotes.html` — "JSON single quotes not allowed"
6. `blog/json-error-undefined-value.html` — "JSON undefined is not valid"
7. `blog/json-error-circular-reference.html` — "JSON circular reference error"
8. `blog/json-error-comments-not-allowed.html` — "JSON does not allow comments"
9. `blog/json-error-nan-infinity.html` — "JSON NaN and Infinity not supported"
10. `blog/json-error-key-not-string.html` — "JSON object keys must be strings"

### Group B — Tool Variant Pages (create 8 pages)
Targets use-case specific searches.

11. `blog/format-json-python.html` — "format JSON in Python" (includes Python snippet + link to online tool)
12. `blog/format-json-javascript.html` — "JSON.stringify pretty print JS"
13. `blog/format-json-bash-terminal.html` — "format JSON in terminal with jq"
14. `blog/validate-json-schema.html` — "validate JSON against schema"
15. `blog/json-to-csv-python.html` — "convert JSON to CSV Python"
16. `blog/json-to-yaml-kubernetes.html` — "convert JSON to YAML Kubernetes config"
17. `blog/base64-encode-decode-explained.html` — "base64 encoding explained with examples"
18. `blog/url-encode-special-characters.html` — "URL encode special characters list"

### Group C — Workflow / How-To Pages (create 8 pages)
Targets developer workflow searches.

19. `blog/pretty-print-json-api-response.html` — "pretty print API response JSON"
20. `blog/debug-json-api-errors.html` — "how to debug JSON API errors"
21. `blog/json-best-practices.html` — "JSON naming conventions and best practices"
22. `blog/json-vs-xml.html` — "JSON vs XML comparison"
23. `blog/json-vs-yaml.html` — "JSON vs YAML which to use"
24. `blog/online-vs-local-json-tools.html` — "online JSON tools vs VS Code extension"
25. `blog/timestamp-unix-epoch-explained.html` — "Unix timestamp vs epoch time explained"
26. `blog/what-is-base64-used-for.html` — "what is Base64 encoding used for"

### Group D — Comparison Pages (create 5 pages)
Targets branded competitor searches.

27. `blog/jsonformatter-org-alternative.html` — "best jsonformatter.org alternative"
28. `blog/jsonlint-alternative.html` — "JSONLint alternative online"
29. `blog/json-editor-online-alternative.html` — "JSON Editor Online alternative"
30. `blog/code-beautify-json-alternative.html` — "Code Beautify JSON alternative"
31. `blog/best-online-json-tools-2026.html` — "best online JSON tools 2026"

### Group E — SEO gap pages (create 5 pages)
32. `blog/json-stringify-indent.html` — "JSON.stringify indent and spacing"
33. `blog/json-parse-error-handling.html` — "JSON.parse error handling examples"
34. `blog/minify-json-reduce-size.html` — "how much does minifying JSON reduce size"
35. `blog/json-array-vs-object.html` — "JSON array vs object difference"
36. `blog/free-developer-tools-browser.html` — "free developer tools that work in browser"

**Total: 36 new pages**  
**Velocity target:** 3 per week = 12 weeks to publish all

---

## Section 3 — Reddit Post Templates

Post once per subreddit. Do not post the same content twice. Space posts 2+ weeks apart. Always lead with value — never start with "check out my site."

### r/webdev (800K members)
```
Title: I got tired of JSON formatters with ads and sign-up walls, so I built a free one

I work with API responses every day and kept running into JSON tools that either have intrusive ads, require accounts, or send your data to their servers.

Built a simple hub at [URL] that does:
- JSON formatting/validation/minification
- Base64 + URL encoding/decoding  
- Unix timestamp conversion
- JSON to CSV and YAML

Everything runs 100% in the browser. No tracking of your input data, no sign-up, no paywall.

Happy to add features if there's demand — what do you find yourself reaching for most in your daily workflow?
```

### r/programming (6M members)
```
Title: Built a client-side developer tools hub — all processing stays in your browser

I wanted a single place for the small utilities I reach for constantly (JSON formatting, Base64, URL encoding) without any of them phoning home with my data.

The project: [URL]

All logic runs in vanilla JS. The source is on GitHub at [repo URL] — contributions welcome.

Curious what tools you'd add. I'm considering a JWT decoder and a regex tester next.
```

### r/javascript (2.3M members)
```
Title: JSON.stringify with custom indentation — online tool + the JS behind it

Quick post: if you need pretty-printing with 2, 4, or 8 space indentation (not just the JSON.stringify default), I built a tool for it: [formatter URL]

Under the hood it's just `JSON.stringify(JSON.parse(input), null, indent)` — but with error context (shows line/column of the error), syntax highlighting in the output, and a one-click copy.

Also added drag-and-drop file support so you can drop a .json file directly on the textarea.
```

### r/devops (300K members)
```
Title: Free JSON to YAML converter for Kubernetes/Ansible configs — no login, browser only

If you prototype configs in JSON and need to convert to YAML for K8s or Ansible, this might save a few seconds: [yaml tool URL]

Handles nested objects and arrays using standard YAML indentation. No server involved — runs in your browser, no data leaves your machine.

Also has a JSON formatter and JSON to CSV converter if useful for pipeline data work.
```

---

## Section 4 — Dev.to Article Plan

Post 1 article per week for 5 weeks. Dev.to articles rank well on Google and drive direct referral traffic. Use canonical tags pointing back to your site if you republish.

**Article 1:** "Why online JSON tools are risky — and how to use one safely"  
Hook: privacy angle. Data never leaves the browser. Links to your tools. Estimated reach: high (privacy resonates).

**Article 2:** "10 JSON errors I see every week and how to fix them"  
Hook: practical error guide. Reference your validator. Include code examples. Estimated reach: very high (evergreen).

**Article 3:** "JSON.stringify: the complete guide to pretty-printing, sorting keys, and indentation"  
Hook: JS fundamentals. Covers `JSON.stringify(value, replacer, space)`. Links to your formatter. Estimated reach: high.

**Article 4:** "Converting JSON to YAML for Kubernetes — a quick walkthrough"  
Hook: DevOps workflow. Short, practical, links to your YAML converter. Estimated reach: medium.

**Article 5:** "I built a JSON share link with 150 bytes of JavaScript (no backend)"  
Hook: technical deep-dive on LZ-string URL compression. Shows the code. Links to your formatter share feature. Estimated reach: high (technical curiosity).

---

## Section 5 — Product Hunt Launch Checklist

**Best day to launch:** Tuesday or Wednesday  
**Best time:** 12:01 AM PST (when the PH day resets)

Pre-launch (2 weeks before):
- [ ] Create Product Hunt account for pasindu98ishan@gmail.com
- [ ] Upload logo (240×240 PNG, dark background)
- [ ] Prepare 3–5 screenshots: formatter with syntax highlighting, dark mode, mobile view, YAML output, share link
- [ ] Write tagline: "Free browser-based developer tools. No signup, no ads, no data sent to servers."
- [ ] Write description (280 chars): "JSON formatter, validator, minifier, Base64, URL encoder, and timestamp converter — all running 100% in your browser. Your data never leaves your device. No account required."
- [ ] Add first comment ready to post at launch: explain the privacy angle and invite feature requests
- [ ] Identify 5 developer friends/contacts to upvote on launch day (do not ask publicly)

Launch day:
- [ ] Post at 12:01 AM PST
- [ ] Post first comment immediately explaining the story
- [ ] Share on Reddit r/webdev (with genuine post, not just "go vote for me")
- [ ] Reply to every comment within 2 hours

---

## Section 6 — Hacker News "Show HN" Template

HN traffic is high-quality (senior engineers, decision makers) but hard to convert. Lead with technical depth.

**Title:**
```
Show HN: Browser-only developer tools hub (JSON, Base64, URL encoding) – no server
```

**Body:**
```
I built a small hub of developer utilities that I reach for daily: JSON formatting/validation/minification, Base64 encoding, URL encoding/decoding, Unix timestamp conversion, and JSON-to-CSV/YAML conversion.

Everything runs client-side. There's no backend, no account system, and no analytics on your input data. The only external request is Google Analytics on page load (page views only — not input content).

The formatter has syntax-highlighted output, inline error messages with line/column details, a JSON tree viewer, and drag-and-drop file input.

Source: [GitHub repo URL]  
Site: https://pasindu98ishan.github.io/json-formatter/

Happy to discuss the implementation or take feature suggestions.
```

**Timing:** Post between 8–10 AM EST on a weekday (highest HN activity window).

---

## Section 7 — 12-Week Content Calendar

Goal: 3 new pages per week. Prioritize blog posts in Weeks 1–4 (quick SEO wins), then ramp to comparison and workflow content.

| Week | Pages | Type |
|---|---|---|
| 1 | json-error-unexpected-token, json-error-trailing-comma, json-error-single-quotes | Error pages |
| 2 | json-error-missing-comma, json-error-undefined-value, json-error-comments-not-allowed | Error pages |
| 3 | json-error-unexpected-end-of-json, json-error-circular-reference, json-error-nan-infinity | Error pages |
| 4 | format-json-python, format-json-javascript, format-json-bash-terminal | Tool variants |
| 5 | json-to-csv-python, json-to-yaml-kubernetes, base64-encode-decode-explained | Tool variants |
| 6 | validate-json-schema, url-encode-special-characters, json-error-key-not-string | Tool variants / Error |
| 7 | pretty-print-json-api-response, debug-json-api-errors, json-best-practices | Workflow |
| 8 | json-vs-xml, json-vs-yaml, online-vs-local-json-tools | Workflow |
| 9 | timestamp-unix-epoch-explained, what-is-base64-used-for, json-stringify-indent | Workflow |
| 10 | json-parse-error-handling, minify-json-reduce-size, json-array-vs-object | SEO gap |
| 11 | jsonformatter-org-alternative, jsonlint-alternative, json-editor-online-alternative | Comparison |
| 12 | code-beautify-json-alternative, best-online-json-tools-2026, free-developer-tools-browser | Comparison / SEO gap |

---

## Section 8 — Traffic Projection

| Month | Realistic Low | Realistic High | If Share Link goes viral |
|---|---|---|---|
| Month 1 | 600 | 1,200 | 3,000–8,000 |
| Month 2 | 1,500 | 3,500 | — |
| Month 3 | 3,000 | 8,000 | — |

The 20K/month target in 3 months is possible only with a viral event (Product Hunt #1, HN front page, or a major Dev.to post). The sustainable path hits 6K–10K by month 3 through content velocity alone.

**Highest-leverage single action:** Ship the JSON Share Link feature (dev-changes.md item #7) before the Product Hunt launch. Shareable links are the main viral mechanism and the strongest differentiator from competitors like jsonformatter.org.
