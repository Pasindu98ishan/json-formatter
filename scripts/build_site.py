"""Assemble the publishable site into _site/ from an explicit allowlist.

GitHub Pages used to upload the whole repository (path: '.'), which published
IDE databases (.vs/), internal planning docs (*.md), a growth-report PDF and
tooling scripts to jsondevtools.org. This script copies only what the site
serves, then fails the build if:

  1. a sitemap URL has no file in _site/          (something real was dropped)
  2. an internal href/src in _site/ points nowhere (a broken internal link),
     or a page carries malformed / unparseable JSON-LD
  3. a non-web or hidden file made it into _site/ (the allowlist leaked)
  4. errors.html's baked-in count or "Last updated" date drifts from reality

Run locally before pushing:  python scripts/build_site.py
"""
import json
import os
import re
import shutil
import sys

OUT = '_site'

# Root-level files: served web assets only. Internal tooling at the root
# (package.json, seo-audit-report.js, *.md, *.py, *.pdf, *.sh) is excluded.
ROOT_EXTENSIONS = {'.html', '.xml', '.txt', '.svg', '.png', '.ico'}
ROOT_NAMES = {'CNAME', '.nojekyll'}

# Directories the site serves, each with the extensions it may publish. A file
# outside its directory's set is skipped (and reported), so a stray .map, .log,
# .DS_Store or scratch file can never ride along. Hidden files are never copied.
SITE_DIRS = {
    'blog': {'.html', '.svg'},
    'css': {'.css'},
    'data': {'.json'},
    'errors': {'.html', '.svg'},
    'http-status': {'.html'},
    'images': {'.png'},
    'js': {'.js'},
}
KNOWN_SOURCES = {'.mjs', '.md'}         # js/cm6-entry.mjs is the bundle's source; skipped silently
DEV_ONLY = {'js/ad-tests.js', 'js/tests.js'}   # console test harnesses, never published

# Anything matching these must never be published.
FORBIDDEN_EXT = {'.md', '.py', '.pdf', '.sh', '.db', '.sqlite', '.mjs', '.wsuo', '.vsidx', '.yml'}

EXTERNAL = ('http://', 'https://', '//', 'mailto:', 'tel:', '#', 'data:', 'javascript:')


def build():
    # Empty the folder rather than deleting it: on Windows a local preview
    # server holding _site/ as its working directory makes rmtree(OUT) fail.
    os.makedirs(OUT, exist_ok=True)
    for entry in os.listdir(OUT):
        path = os.path.join(OUT, entry)
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)
    copied = 0
    skipped = []

    for name in sorted(os.listdir('.')):
        if not os.path.isfile(name):
            continue
        if name in ROOT_NAMES or os.path.splitext(name)[1].lower() in ROOT_EXTENSIONS:
            shutil.copy2(name, os.path.join(OUT, name))
            copied += 1

    for d, allowed in SITE_DIRS.items():
        for dirpath, dirnames, files in os.walk(d):
            hidden = [x for x in dirnames if x.startswith('.')]
            skipped += [os.path.join(dirpath, x) + '/' for x in hidden]
            dirnames[:] = [x for x in dirnames if x not in hidden]
            for f in files:
                src = os.path.join(dirpath, f)
                ext = os.path.splitext(f)[1].lower()
                if src.replace(os.sep, '/') in DEV_ONLY:
                    continue
                if f.startswith('.') or ext not in allowed:
                    if ext not in KNOWN_SOURCES:
                        skipped.append(src)
                    continue
                dst = os.path.join(OUT, src)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)
                copied += 1
    return copied, skipped


def check():
    problems = []

    # 1. every sitemap URL resolves to a published file
    sitemap = open(os.path.join(OUT, 'sitemap.xml'), encoding='utf-8').read()
    for url in re.findall(r'<loc>([^<]+)</loc>', sitemap):
        path = re.sub(r'^https?://[^/]+/', '', url)
        if path == '' or path.endswith('/'):
            path += 'index.html'
        if not os.path.isfile(os.path.join(OUT, path)):
            problems.append(f'sitemap URL has no file: {url}')

    # 2. internal links inside published HTML resolve inside _site/
    for dirpath, _, files in os.walk(OUT):
        for f in files:
            if not f.endswith('.html'):
                continue
            page = os.path.join(dirpath, f)
            html = open(page, encoding='utf-8').read()
            # structured data must be a well-formed ld+json tag with parseable JSON;
            # a malformed tag (e.g. curly quotes) silently drops the schema
            for m in re.finditer(r'<script([^>]*ld\+json[^>]*)>(.*?)</script>', html, flags=re.S | re.I):
                if not re.search(r'type="application/ld\+json"', m.group(1)):
                    problems.append(f'malformed JSON-LD script tag: {os.path.relpath(page, OUT)}')
                    continue
                try:
                    json.loads(m.group(2))
                except ValueError as e:
                    problems.append(f'invalid JSON-LD: {os.path.relpath(page, OUT)} ({e})')
            # code samples and scripts contain example markup, not real links
            html = re.sub(r'<(pre|script|style)\b.*?</\1>', '', html, flags=re.S | re.I)
            for ref in re.findall(r'\b(?:href|src)="([^"]+)"', html):
                if ref.startswith(EXTERNAL):
                    continue
                target = ref.split('#')[0].split('?')[0]
                if not target:
                    continue
                if target.startswith('/'):
                    resolved = os.path.join(OUT, target.lstrip('/'))
                else:
                    resolved = os.path.normpath(os.path.join(dirpath, target))
                if resolved.endswith(os.sep) or os.path.isdir(resolved):
                    resolved = os.path.join(resolved, 'index.html')
                if not os.path.exists(resolved):
                    problems.append(f'broken link: {os.path.relpath(page, OUT)} -> {ref}')

    # 3b. the error hub's "N errors documented" count and "Last updated" date
    # are baked into the static HTML (so a crawler without JS sees them too,
    # unlike the old #errCount that only JS filled in) — check they still
    # match reality instead of drifting silently, the way the "0" and
    # "Last updated: June 2026" version did.
    hub = os.path.join(OUT, 'errors.html')
    if os.path.isfile(hub):
        html = open(hub, encoding='utf-8').read()
        m = re.search(r'<table[^>]*id="errTable"[^>]*>.*?</table>', html, re.S)
        real_count = len(re.findall(r'<tr\b', re.search(r'<tbody\b.*?</tbody>', m.group(0), re.S).group(0))) if m else None
        baked = re.search(r'<strong id="errCount">(\d+)</strong>', html)
        if real_count is None or not baked:
            problems.append('errors.html: could not locate the error table or the #errCount value to check')
        elif int(baked.group(1)) != real_count:
            problems.append(f'errors.html: #errCount says {baked.group(1)} but the table has {real_count} rows')

        dated = re.search(r'Last updated:\s*([A-Za-z]+)\s+(\d{4})', html)
        sm = re.search(r'<loc>https://jsondevtools\.org/errors\.html</loc>\s*<lastmod>(\d{4})-(\d{2})-\d{2}</lastmod>', sitemap)
        if not dated or not sm:
            problems.append('errors.html: could not find both the "Last updated" text and its sitemap.xml lastmod to compare')
        else:
            import calendar
            shown = (dated.group(1), dated.group(2))
            actual = (calendar.month_name[int(sm.group(2))], sm.group(1))
            if shown != actual:
                problems.append(f'errors.html: "Last updated: {shown[0]} {shown[1]}" does not match sitemap.xml lastmod ({actual[0]} {actual[1]}) — update both together')

    # 3. nothing internal leaked through
    for dirpath, dirnames, files in os.walk(OUT):
        for d in dirnames:
            if d.startswith('.'):
                problems.append(f'hidden directory published: {os.path.join(dirpath, d)}')
        for f in files:
            rel = os.path.relpath(os.path.join(dirpath, f), OUT)
            if f.startswith('.') and f not in ROOT_NAMES:
                problems.append(f'hidden file published: {rel}')
            elif os.path.splitext(f)[1].lower() in FORBIDDEN_EXT:
                problems.append(f'internal file published: {rel}')

    return problems


if __name__ == '__main__':
    n, skipped = build()
    issues = check()
    print(f'_site/: {n} files published')
    if skipped:
        print(f'{len(skipped)} file(s) outside the allowlist NOT published (add the extension to SITE_DIRS if one is needed):')
        for s in skipped:
            print('  ' + s)
    if issues:
        print(f'{len(issues)} problem(s) — refusing to deploy:')
        for p in issues:
            print('  ' + p)
        sys.exit(1)
    print('checks passed: sitemap complete, no broken internal links, no internal files')
