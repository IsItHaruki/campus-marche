'use strict';
/* Campus マルシェ — mini chat server for testing.
   Run:   node server/server.js      then open http://localhost:3458
   - Serves the app (same files as the preview).
   - /api/events  : live connection (Server-Sent Events). The app listens here for replies.
   - /api/chat    : the app sends your message; a bot student reads it, types, and replies.
   - /api/listing : the app tells the server you posted something; a bot student may message you.
   No packages to install: only Node's built-in modules. */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { respond, interestedBot } = require('./bot');

const PORT = Number(process.env.PORT) || 3458;
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8' };

const clients = new Set();
function broadcast(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((res) => res.write(data));
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (a, b) => a + Math.random() * (b - a);

// Play the bot's steps like a person: read, think, type, send
async function play(threadId, botId, steps) {
  await wait(jitter(500, 1200));
  broadcast({ type: 'read', threadId, from: botId });
  for (const step of steps) {
    if (step.say) {
      await wait(jitter(300, 700));
      broadcast({ type: 'typing', threadId, from: botId, on: true });
      await wait(Math.min(4000, Math.max(1100, 600 + step.say.length * 45)));
      broadcast({ type: 'message', threadId, from: botId, text: step.say });
    } else if (step.action) {
      await wait(jitter(500, 1000));
      broadcast({ type: 'action', threadId, from: botId, ...step });
    }
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); } });
  });
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/health') return json(res, 200, { ok: true, bots: ['u_mai', 'u_leo', 'u_yuki'] });

  if (url.pathname === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => { clearInterval(ping); clients.delete(res); });
    return;
  }

  if (url.pathname === '/api/chat' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const steps = respond(body);
      console.log(`[chat] ${body.kind} → ${body.botId}: ${(body.text || body.amount || '').toString().slice(0, 60)}  (${steps.length} step(s))`);
      json(res, 202, { ok: true });
      play(body.threadId, body.botId, steps);
    } catch (e) { json(res, 400, { error: e.message }); }
    return;
  }

  if (url.pathname === '/api/listing' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      json(res, 202, { ok: true });
      const bot = interestedBot(body.sellerId, body.campus, body.bots);
      if (!bot) return;
      const [step] = respond({ botId: bot.id, role: 'buyer', kind: 'interest', listing: body.listing, uiLang: body.uiLang });
      console.log(`[listing] "${body.listing && body.listing.title}" → ${bot.id} will ask about it`);
      await wait(jitter(5000, 9000));
      broadcast({ type: 'interest', from: bot.id, listingId: body.listing.id, text: step.say });
    } catch (e) { json(res, 400, { error: e.message }); }
    return;
  }

  // static files
  let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`Campus マルシェ chat server running: http://localhost:${PORT}`));
