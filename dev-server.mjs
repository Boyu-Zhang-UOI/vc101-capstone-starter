// dev-server.mjs: a tiny local web server for development. No packages needed.
//
// What it does:
//   1. Loads your settings from .env (if the file exists) into process.env.
//   2. Serves the files in public/ (your web page) to the browser.
//   3. Sends requests for /api/<name> to the file api/<name>.js, the same way
//      Vercel does when your app is deployed.
//
// Start it with:  npm run dev      Stop it with:  Ctrl+C
// After you change .env or any server code (api/ or lib/), stop it and start it again.

import http from 'node:http';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');
const API_DIR = path.join(ROOT, 'api');
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_BYTES = 1_000_000; // refuse request bodies bigger than about 1 MB

// 1. Load .env. Variables that are already set (for example Codespaces secrets) win.
const envFile = path.join(ROOT, '.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
  console.log('Loaded settings from .env');
} else {
  console.log('No .env file found. To add your settings, run: cp .env.example .env');
}

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
    } else {
      await serveStatic(req, res, url);
    }
  } catch (err) {
    console.error(`[dev-server] ${req.method} ${url.pathname} failed:`, err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Something went wrong on the server. Check the terminal for details.' });
    } else {
      res.end();
    }
  }
  console.log(`${req.method} ${url.pathname} -> ${res.statusCode}`);
});

// 2. Static files from public/
async function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }
  let filePath = path.join(PUBLIC_DIR, decodeURIComponent(url.pathname));
  // Never serve anything outside public/ (for example /../.env).
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  const info = await stat(filePath).catch(() => null);
  if (info?.isDirectory()) filePath = path.join(filePath, 'index.html');
  const body = await readFile(filePath).catch(() => null);
  if (body === null) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Not found: ${url.pathname}`);
    return;
  }
  const type = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(req.method === 'HEAD' ? undefined : body);
}

// 3. /api/<name> -> api/<name>.js
async function handleApi(req, res, url) {
  const name = url.pathname.slice('/api/'.length);
  const file = path.join(API_DIR, `${name}.js`);
  if (!/^[a-z0-9_-]+$/i.test(name) || !existsSync(file)) {
    sendJson(res, 404, { error: `No server route called ${url.pathname}. Server routes live in api/<name>.js.` });
    return;
  }
  const route = (await import(pathToFileURL(file).href)).default;
  if (typeof route?.fetch !== 'function') {
    sendJson(res, 500, { error: `api/${name}.js must export default { async fetch(request) { ... } }` });
    return;
  }

  // Convert Node's request into a Web-standard Request (what Vercel gives your code).
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      sendJson(res, 413, { error: 'That request is too big.' });
      return;
    }
    chunks.push(chunk);
  }
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value !== undefined) headers.set(key, value);
  }
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const request = new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? Buffer.concat(chunks) : undefined,
  });

  const response = await route.fetch(request);

  // Convert the Web-standard Response back into Node's response.
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (response.body) {
    for await (const chunk of response.body) res.write(chunk); // works for streamed replies too
  }
  res.end();
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Is the server already running in another terminal?`);
    console.error(`Stop it with Ctrl+C there, or start this one on another port: PORT=3001 npm run dev`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log('');
  console.log(`Dev server running at http://localhost:${PORT}`);
  console.log(`In a Codespace, port ${PORT} is forwarded for you: click "Open in Browser" in the pop-up,`);
  console.log('or open the PORTS tab and click the globe icon. Keep the port Private.');
  describeSettings();
  console.log('Press Ctrl+C to stop.');
  console.log('');
});

// Say which provider and model are configured, without ever printing the key.
function describeSettings() {
  const base = process.env.LLM_BASE_URL || '';
  const key = process.env.LLM_API_KEY || '';
  const model = process.env.LLM_MODEL || '';
  let host = '(not set)';
  try {
    if (base) host = new URL(base).host;
  } catch {
    host = '(not a valid URL)';
  }
  console.log(`AI provider: ${host} · model: ${model || '(not set)'} · API key: ${key && !key.startsWith('paste-') ? 'set' : 'NOT SET'}`);
}
