const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'], '/learning.js': ['learning.js', 'text/javascript; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'] };
const server = http.createServer((request, response) => {
  const file = files[new URL(request.url, 'http://localhost').pathname];
  if (!file) { response.writeHead(404); response.end('Not found'); return; }
  fs.readFile(path.join(__dirname, file[0]), (error, data) => {
    if (error) { response.writeHead(500); response.end('Unable to load file'); return; }
    response.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store' }); response.end(data);
  });
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? '端口 8765 已被占用，请关闭已有服务后重试。' : error.message); process.exitCode = 1; });
server.listen(8765, '127.0.0.1', () => console.log('小小画家：http://127.0.0.1:8765 — 按 Ctrl+C 停止服务'));
