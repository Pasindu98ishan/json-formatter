#!/usr/bin/env node
// Guard against oversized <meta name="description"> tags (Google truncates past ~155-160 chars).
// Usage: node scripts/check-meta-description.js [dir ...]   (defaults to errors/ blog/)

const fs = require('fs');
const path = require('path');

const LIMIT = 160;
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['errors', 'blog'];

function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
    }
    return out;
}

const descRe = /<meta\s+name="description"\s+content="([^"]*)"/i;
let offenders = 0;
let checked = 0;

for (const dir of targets) {
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir)) {
        const html = fs.readFileSync(file, 'utf8');
        const match = html.match(descRe);
        if (!match) continue;
        checked++;
        const desc = match[1].replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/&ndash;/g, '–');
        if (desc.length > LIMIT) {
            offenders++;
            console.log(`${desc.length.toString().padStart(3)} chars  ${file}`);
        }
    }
}

console.log(`\nChecked ${checked} pages. ${offenders} exceed ${LIMIT} chars.`);
process.exit(offenders > 0 ? 1 : 0);
