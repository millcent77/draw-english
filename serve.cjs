const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'], '/learning.js': ['learning.js', 'text/javascript; charset=utf-8'], '/pets.js': ['pets.js', 'text/javascript; charset=utf-8'], '/curriculum.js': ['curriculum.js', 'text/javascript; charset=utf-8'], '/drawing-tasks.js': ['drawing-tasks.js', 'text/javascript; charset=utf-8'], '/english-translations.js': ['english-translations.js', 'text/javascript; charset=utf-8'], '/assets/pet-cat.png': ['assets/pet-cat.png', 'image/png'], '/assets/pet-dog.png': ['assets/pet-dog.png', 'image/png'], '/assets/pet-rabbit.png': ['assets/pet-rabbit.png', 'image/png'], '/assets/pet-panda.png': ['assets/pet-panda.png', 'image/png'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'] };
for (const name of ['twinkle', 'mary', 'alphabet']) files['/assets/songs/' + name + '.mp3'] = ['assets/songs/' + name + '.mp3', 'audio/mpeg'];
files['/songs-player.js'] = ['songs-player.js', 'text/javascript; charset=utf-8'];
files['/songs.js'] = ['songs.js', 'text/javascript; charset=utf-8'];
const server = http.createServer((request, response) => {
  const file = files[new URL(request.url, 'http://localhost').pathname];
  if (!file) { response.writeHead(404); response.end('Not found'); return; }
  if (file[1] === 'audio/mpeg') {
    const audioPath = path.join(__dirname, file[0]);
    fs.stat(audioPath, (error, stat) => {
      if (error) { response.writeHead(404); response.end('Audio not found'); return; }
      let start = 0, end = stat.size - 1;
      const range = request.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match || (!match[1] && !match[2])) { response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); response.end(); return; }
        if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
        else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
        if (start > end || start >= stat.size || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) { response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); response.end(); return; }
      }
      response.writeHead(range ? 206 : 200, { 'Content-Type': file[1], 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, ...(range ? { 'Content-Range': `bytes ${start}-${end}/${stat.size}` } : {}) });
      if (request.method === 'HEAD') { response.end(); return; }
      const stream = fs.createReadStream(audioPath, { start, end });
      stream.on('error', () => response.destroy()); response.on('close', () => stream.destroy()); stream.pipe(response);
    });
    return;
  }
  fs.readFile(path.join(__dirname, file[0]), (error, data) => {
    if (error) { response.writeHead(500); response.end('Unable to load file'); return; }
    response.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store' }); response.end(data);
  });
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? '端口 8765 已被占用，请关闭已有服务后重试。' : error.message); process.exitCode = 1; });
if (require.main === module) server.listen(8765, '127.0.0.1', () => console.log('小小画家：http://127.0.0.1:8765 — 按 Ctrl+C 停止服务'));
module.exports = server;
