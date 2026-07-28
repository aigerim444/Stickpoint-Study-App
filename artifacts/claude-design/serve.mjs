// Simple static file server for Stickpoint — replaces Vite for this artifact.
// Serves index.html, support.js, and stickpoint-content.js from ./public/.
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC = join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

createServer((req, res) => {
  let pathname = req.url.split('?')[0];
  // Always serve index.html for root or unknown paths
  if (pathname === '/' || pathname === '') pathname = '/index.html';

  const file = join(PUBLIC, pathname);

  // Security: make sure we don't escape public dir
  if (!file.startsWith(PUBLIC)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!existsSync(file)) {
    // SPA fallback — return index.html for any unknown path
    const fallback = join(PUBLIC, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(fallback).pipe(res);
    return;
  }

  const mime = MIME[extname(file)] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Stickpoint static server listening on port ${PORT}`);
});
