const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const server = require('../serve.cjs');
function request(port, path, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, headers, method }, response => {
      const chunks = []; response.on('data', chunk => chunks.push(chunk)); response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    }); req.on('error', reject); req.end();
  });
}
server.listen(0, '127.0.0.1', async () => {
  try {
    const port = server.address().port;
    assert.equal((await request(port, '/songs.js')).status, 200);
    for (const name of ['twinkle', 'mary', 'row']) {
      const path = `/assets/songs/${name}.ogg`, local = fs.readFileSync(`assets/songs/${name}.ogg`);
      const full = await request(port, path); assert.equal(full.status, 200); assert.deepEqual(full.body, local);
      const partial = await request(port, path, { Range: 'bytes=0-31' }); assert.equal(partial.status, 206); assert.deepEqual(partial.body, local.subarray(0, 32));
      const suffix = await request(port, path, { Range: 'bytes=-16' }); assert.equal(suffix.status, 206); assert.deepEqual(suffix.body, local.subarray(-16));
      assert.equal((await request(port, path, { Range: 'bytes=999999999-' })).status, 416);
      assert.equal((await request(port, path, {}, 'HEAD')).body.length, 0);
    }
    assert.equal((await request(port, '/assets/songs/../app.js')).status, 404);
    console.log('PASS: music routes, full audio, seek ranges, suffix ranges, invalid ranges and HEAD.');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { server.close(); }
});
