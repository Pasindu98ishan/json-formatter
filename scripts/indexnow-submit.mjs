#!/usr/bin/env node
// ============================================================
// IndexNow bulk submitter for jsondevtools.org
//
// Notifies Bing / Yandex / Seznam / Naver (and any IndexNow
// partner) that our URLs are new or updated, for near-instant
// indexing instead of waiting for a crawl.
//
// Reads every <loc> from sitemap.xml and POSTs them in one batch
// (IndexNow allows up to 10,000 URLs per request).
//
// PREREQUISITE: the key file must already be LIVE at
//   https://jsondevtools.org/cb1f05ee410a42c0807a5e31d0f71e1d.txt
// IndexNow fetches it to verify ownership, so deploy (git push →
// GitHub Pages) BEFORE running this.
//
// Usage:
//   node scripts/indexnow-submit.mjs            # submit all sitemap URLs
//   node scripts/indexnow-submit.mjs <url> ...  # submit only the given URLs
// ============================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOST = 'jsondevtools.org';
const KEY = 'cb1f05ee410a42c0807a5e31d0f71e1d';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/IndexNow';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function urlsFromSitemap() {
  const xml = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

const argv = process.argv.slice(2);
const urlList = argv.length ? argv : urlsFromSitemap();

if (urlList.length === 0) {
  console.error('No URLs to submit.');
  process.exit(1);
}
if (urlList.length > 10000) {
  console.error(`IndexNow accepts max 10,000 URLs per request; got ${urlList.length}.`);
  process.exit(1);
}

const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };

console.log(`Submitting ${urlList.length} URL(s) to IndexNow (${ENDPOINT})...`);

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

const text = await res.text();
// 200 = accepted; 202 = accepted, key validation pending; 4xx = problem.
console.log(`HTTP ${res.status} ${res.statusText}`);
if (text.trim()) console.log(text.trim());

if (res.status === 200 || res.status === 202) {
  console.log(`✓ Submitted. Bing typically reflects this in Webmaster Tools within minutes to hours.`);
} else {
  console.error(`✗ Submission failed. Common causes: key file not live yet at ${KEY_LOCATION}, or a URL host that doesn't match ${HOST}.`);
  process.exit(1);
}
