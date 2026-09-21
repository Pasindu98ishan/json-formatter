# DRAFT: post 1 for dev.to (or Show HN as a "Show HN: ..." text post)

> Draft written 2026-09-21 for Pasindu to review, edit into his own voice and publish under his own account by Fri Sep 25.
> Everything below is taken from what actually happened in this repo (commit history and `js/app.js` / `js/analytics.js`). Check every claim before posting. Delete this header.
> Disclosure line at the end is required: it is your own site.

**Title options**
- My JSON formatter's "Share" button was leaking pasted JSON to analytics. Here is the fix.
- Query string vs URL fragment: a share-link bug I shipped in a "privacy-first" tool

**Tags:** privacy, javascript, webdev, security

---

I run a set of browser-only developer tools (a JSON formatter, a JWT decoder and so on). The pitch is that whatever you paste never leaves your browser. While preparing the site for a review this month, I re-read my own share feature and found it breaking that promise.

## The bug

The formatter has a Share button. It compresses the formatted JSON with lz-string and builds a link:

```js
const compressed = LZString.compressToEncodedURIComponent(text);
const url = location.origin + location.pathname + '?j=' + compressed;
```

That puts the payload in the **query string**. Two things follow from that:

1. **The server sees it.** A query string is part of the HTTP request. The site is static and hosted on GitHub Pages, so I never see logs, but the host does.
2. **Analytics sees it.** Google Analytics 4 records the full page URL by default. Anyone who opened a share link, including me testing it, sent the whole JSON document to GA as part of `page_location`.

Nothing in the tool's processing was wrong. The leak was in the feature that made the result portable.

## The fix

Move the payload into the URL **fragment** (`#j=...`). Browsers never send the fragment to a server, and it is not part of the request line.

```js
const url = location.origin + location.pathname + '#j=' + compressed;

function getSharedPayload() {
  if (location.hash.indexOf('#j=') === 0) return location.hash.slice(3);
  return new URLSearchParams(location.search).get('j');   // legacy links
}
```

Old links still have to work, so the loader reads the legacy `?j=` form too and then strips it from the address bar with `history.replaceState`.

That is not enough for analytics, though. The GA config call runs in `<head>`, before any of that code, and gtag reads the location itself. So the analytics snippet now builds the page URL explicitly, without the fragment and without the legacy parameter:

```js
const params = new URLSearchParams(location.search);
params.delete('j');
const qs = params.toString();
const pageLocation = location.origin + location.pathname + (qs ? '?' + qs : '');
gtag('config', 'G-XXXXXXX', { page_location: pageLocation });
```

## Checking it

I tested it in a browser instead of trusting my reading of the code: generate a link and confirm it uses `#j=`, open a legacy `?j=...&x=1` link and confirm the JSON loads and the address bar becomes `?x=1`, then run the analytics snippet against a fake URL and confirm the config call contains none of the payload.

## What I could not fix

Links already shared in the old format are still out there, and opening one still sends its contents to the host once before the page can strip it. I said so in the privacy policy rather than pretending otherwise.

## Takeaways

- "Runs in your browser" covers the processing. Check every feature that **moves data out of the tool**: share links, export buttons, error reporting, analytics.
- Put user data in the fragment, not the query string.
- Analytics libraries read the URL. Set `page_location` yourself if any URL can carry user content.

*Disclosure: I build and maintain the tools mentioned here (jsondevtools.org). Feedback and corrections welcome.*
