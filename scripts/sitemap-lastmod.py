#!/usr/bin/env python3
"""Derive an honest <lastmod> per page: the date of the newest commit that changed
the page's VISIBLE BODY CONTENT.

Deliberately ignores, because these were sitewide mechanical edits that say nothing
about whether the page's content changed:
  - everything in <head> (titles, meta descriptions, JSON-LD, script tags)
  - the nav placeholder and the <noscript> fallback nav
  - the <footer>
  - the consent/analytics/adsense script tags

Usage: lastmod.py report      # compare against the current sitemap, change nothing
       lastmod.py write       # rewrite sitemap.xml lastmod values
"""
import hashlib
import os
import re
import subprocess
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TODAY = date.today().isoformat()


def git(*args, binary=False):
    r = subprocess.run(['git'] + list(args), cwd=ROOT, capture_output=True)
    if r.returncode != 0:
        return None
    return r.stdout if binary else r.stdout.decode('utf-8', 'replace')


CHROME = [
    (re.compile(r'<head\b.*?</head>', re.S | re.I), ''),
    (re.compile(r'<div id="nav-placeholder".*?</div>', re.S | re.I), ''),
    (re.compile(r'<noscript\b.*?</noscript>', re.S | re.I), ''),
    (re.compile(r'<footer\b.*?</footer>', re.S | re.I), ''),
    (re.compile(r'<script\b.*?</script>', re.S | re.I), ''),
    # sitewide author/byline furniture: updated in bulk on 242+ pages, says nothing
    # about whether this page's content changed
    (re.compile(r'<div class="article-meta-author">.*?</div>', re.S | re.I), ''),
    (re.compile(r'<div class="article-meta">.*?</div>', re.S | re.I), ''),
    (re.compile(r'<div class="author-bio">.*?</div>\s*', re.S | re.I), ''),
    # the call-to-action block is the same class of furniture: boilerplate that gets
    # reworded in bulk, not an answer to "did this page's content change?"
    (re.compile(r'<div class="tool-cta">.*?</div>\s*</div>', re.S | re.I), ''),
    (re.compile(r'\s+'), ' '),
]


def body_hash(html):
    if html is None:
        return None
    # a BOM and the doctype/<html> boilerplate are not content; a bulk commit on
    # 2026-06-12 added a BOM to 130 files and would otherwise read as 130 edits
    html = html.lstrip('﻿')
    html = re.sub(r'<!DOCTYPE[^>]*>', '', html, flags=re.I)
    html = re.sub(r'</?html[^>]*>', '', html, flags=re.I)
    html = re.sub(r'</?body[^>]*>', '', html, flags=re.I)
    for pat, rep in CHROME:
        html = pat.sub(rep, html)
    return hashlib.sha1(html.strip().encode('utf-8', 'replace')).hexdigest()


def commits_for(path):
    out = git('log', '--follow', '--pretty=format:%H|%ad', '--date=short', '--', path)
    if not out:
        return []
    rows = []
    for line in out.strip().splitlines():
        if '|' in line:
            h, d = line.split('|', 1)
            rows.append((h.strip(), d.strip()))
    return rows


def blob_at(commit, path):
    b = git('show', f'{commit}:{path}', binary=True)
    return None if b is None else b.decode('utf-8', 'replace')


def content_date(path):
    """Newest commit date whose body hash differs from its predecessor's."""
    rows = commits_for(path)
    if not rows:
        return None, 'untracked'

    # uncommitted body change in the working tree?
    try:
        work = open(os.path.join(ROOT, path), encoding='utf-8').read()
    except OSError:
        work = None
    head_html = blob_at(rows[0][0], path)
    if work is not None and body_hash(work) != body_hash(head_html):
        return TODAY, 'uncommitted body change'

    prev = body_hash(head_html)
    for i in range(len(rows) - 1):
        older = body_hash(blob_at(rows[i + 1][0], path))
        if older != prev:
            return rows[i][1], f'body changed in {rows[i][0][:8]}'
        prev = older
    # body never changed after the first commit -> the page's own creation date
    return rows[-1][1], 'original content, never edited'


def sitemap_entries(xml):
    return re.findall(r'<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>', xml)


def url_to_path(url):
    p = re.sub(r'^https?://[^/]+/', '', url)
    if p == '' or p.endswith('/'):
        p += 'index.html'
    return p


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'report'
    xml = open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read()
    entries = sitemap_entries(xml)
    print(f'{len(entries)} sitemap entries\n')

    changes, same, problems = [], 0, []
    newmap = {}
    for url, old in entries:
        path = url_to_path(url)
        if not os.path.exists(os.path.join(ROOT, path)):
            problems.append(f'no such file: {path}')
            continue
        new, why = content_date(path)
        if new is None:
            problems.append(f'no git history: {path}')
            continue
        newmap[url] = new
        if new != old:
            changes.append((path, old, new, why))
        else:
            same += 1

    print(f'unchanged: {same}')
    print(f'would change: {len(changes)}\n')
    fwd = [c for c in changes if c[2] > c[1]]
    back = [c for c in changes if c[2] < c[1]]
    print(f'  moving FORWARD (page was understated): {len(fwd)}')
    print(f'  moving BACK (page was overstated): {len(back)}\n')
    for path, old, new, why in sorted(back, key=lambda r: r[1])[:25]:
        print(f'  BACK  {old} -> {new}  {path}   [{why}]')
    print()
    for path, old, new, why in sorted(fwd, key=lambda r: r[2], reverse=True)[:25]:
        print(f'  FWD   {old} -> {new}  {path}   [{why}]')
    if problems:
        print('\nPROBLEMS:')
        for p in problems:
            print('  ' + p)

    if mode == 'write':
        def repl(m):
            url = m.group(1)
            return m.group(0).replace(f'<lastmod>{m.group(2)}</lastmod>',
                                      f'<lastmod>{newmap.get(url, m.group(2))}</lastmod>')
        new_xml = re.sub(r'<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>', repl, xml)
        open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(new_xml)
        print('\nsitemap.xml rewritten')


if __name__ == '__main__':
    main()
