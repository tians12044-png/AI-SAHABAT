const http = require('http');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const PORT = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'messages.json');
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon' };
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
function readMessages() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return []; } }
function send(res, status, data, type='application/json; charset=utf-8') { res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options':'nosniff' }); res.end(typeof data === 'string' ? data : JSON.stringify(data)); }
function readBody(req) { return new Promise((resolve, reject) => { let body = ''; req.on('data', chunk => { body += chunk; if (body.length > 100 * 1024) { reject(new Error('PAYLOAD_TOO_LARGE')); req.destroy(); } }); req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('INVALID_JSON')); } }); req.on('error', reject); }); }
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok:true, name:'SahabatDengar AI', timestamp:new Date().toISOString() });
  if (url.pathname === '/api/messages' && req.method === 'GET') return send(res, 200, readMessages().slice(-100));
  if (url.pathname === '/api/messages' && req.method === 'DELETE') { fs.writeFileSync(DATA_FILE, '[]', 'utf8'); return send(res, 200, { ok:true }); }
  if (url.pathname === '/api/messages' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return send(res, e.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: e.message === 'PAYLOAD_TOO_LARGE' ? 'Ukuran permintaan terlalu besar.' : 'Format JSON tidak valid.' }); }
    const { text, sender, mode } = body || {};
    if (typeof text !== 'string' || !text.trim()) return send(res, 400, { error:'Pesan tidak boleh kosong.' });
    if (text.length > 2000) return send(res, 413, { error:'Pesan maksimal 2000 karakter.' });
    const message = { id:Date.now().toString(36)+Math.random().toString(36).slice(2,7), text:text.trim(), sender:sender==='partner'?'partner':'you', mode:typeof mode==='string'?mode.slice(0,30):'text', createdAt:new Date().toISOString() };
    const messages = [...readMessages(), message].slice(-500);
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf8');
    return send(res, 201, message);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error:'Method tidak diizinkan.' });
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.resolve(ROOT, '.' + pathname);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      const index = path.join(ROOT, 'index.html');
      return fs.readFile(index, (indexErr, content) => indexErr ? send(res, 404, 'Not found', 'text/plain; charset=utf-8') : send(res, 200, content, MIME['.html']));
    }
    res.writeHead(200, { 'Content-Type':MIME[path.extname(filePath)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});
server.listen(PORT, '0.0.0.0', () => console.log(`SahabatDengar AI berjalan di http://localhost:${PORT}`));
