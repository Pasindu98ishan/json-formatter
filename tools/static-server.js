// Minimal static file server for local image generation only.
// Usage: node tools/static-server.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = parseInt(process.argv[2], 10) || 8731;

const types = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json'
};

http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
    });
}).listen(port, () => console.log('static server on http://localhost:' + port));
