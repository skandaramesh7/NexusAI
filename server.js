// ============================================================
//  Nexus AI – Backend Proxy Server
//  Keeps your Anthropic API key secure on the server side.
//  Run: node server.js
// ============================================================

require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('\n❌  ANTHROPIC_API_KEY not found!');
  console.error('    Create a .env file with: ANTHROPIC_API_KEY=your_key_here\n');
  process.exit(1);
}

// ── MIME types ──────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

// ── Route: POST /api/chat ────────────────────────────────────
function handleChat(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405); res.end('Method Not Allowed'); return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    let payload;
    try { payload = JSON.parse(body); }
    catch { res.writeHead(400); res.end('Bad JSON'); return; }

    const anthropicBody = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are Nexus AI, a friendly and intelligent AI assistant. Give clear, concise, and helpful responses. Keep responses conversational and appropriately brief for a chat interface.',
      messages: payload.messages || []
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(anthropicBody)
      }
    };

    const apiReq = https.request(options, apiRes => {
      let data = '';
      apiRes.on('data', c => data += c);
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    apiReq.on('error', err => {
      console.error('Anthropic API error:', err.message);
      res.writeHead(502);
      res.end(JSON.stringify({ error: { message: 'Failed to reach Anthropic API: ' + err.message } }));
    });

    apiReq.write(anthropicBody);
    apiReq.end();
  });
}

// ── Route: Static file server ────────────────────────────────
function serveStatic(req, res) {
  let filePath = path.join(__dirname, 'public',
    req.url === '/' ? 'index.html' : req.url);

  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ── Main server ──────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(); return;
  }

  if (pathname === '/api/chat') return handleChat(req, res);
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('\n✅  Nexus AI server running!');
  console.log(`🌐  Open in browser: http://localhost:${PORT}`);
  console.log('    Press Ctrl+C to stop.\n');
});
