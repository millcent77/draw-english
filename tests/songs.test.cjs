const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function element(extra = {}) {
  const classes = new Set();
  return Object.assign({ children: [], handlers: {}, attributes: {}, dataset: {}, hidden: false, textContent: '', value: '', checked: true,
    classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }, contains: name => classes.has(name) },
    setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(name, fn) { this.handlers[name] = fn; }, appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, scrollIntoView() {}
  }, extra);
}
const ids = {};
for (const match of fs.readFileSync('index.html', 'utf8').matchAll(/id="([^"]+)"/g)) ids[match[1]] = element();
const study = element(), area = element();
const document = { getElementById: id => ids[id], querySelector: query => query === '.study-panels' ? study : area,
  createElement: () => element(), createTextNode: text => ({ textContent: text }), addEventListener() {} };
const audio = ids['song-audio'];
Object.assign(audio, { paused: true, currentTime: 0, load() { this.currentTime = 0; }, pause() { this.paused = true; this.handlers.pause?.(); }, async play() { this.paused = false; this.handlers.play?.(); } });
ids['song-speed'].value = '1';
const sandbox = { document, speaking: false, recording: false, testingMic: false };
vm.createContext(sandbox); vm.runInContext(fs.readFileSync('songs.js', 'utf8'), sandbox); vm.runInContext(fs.readFileSync('songs-player.js', 'utf8'), sandbox);
const songs = vm.runInContext('englishSongs', sandbox);
assert.equal(songs.length, 3);
for (const song of songs) {
  assert.ok(song.lines.every((line, i) => line[1] && line[2] && (!i || line[0] > song.lines[i - 1][0])));
  const manifest = JSON.parse(fs.readFileSync('assets/songs/recordings.json', 'utf8')).find(item => item.id === song.id);
  const data = fs.readFileSync(`assets/songs/${song.id}.mp3`);
  assert.equal(require('node:crypto').createHash('sha256').update(data).digest('hex'), manifest.sha256);
  assert.ok(manifest.duration > 90); assert.ok(manifest.duration > song.lines.at(-1)[0]);
  assert.ok(song.audioSource.startsWith('https://americanenglish.state.gov/'));
  assert.ok(data.subarray(0, 3).toString() === 'ID3' || data[0] === 255);

}
(async () => {
  ids['show-songs'].handlers.click(); assert.equal(study.hidden, true); assert.equal(ids['songs-panel'].hidden, false);
  await ids['song-play'].handlers.click(); assert.equal(audio.paused, false);
  ids['song-use-video'].handlers.click(); assert.equal(audio.paused, true); assert.equal(ids['song-video-panel'].hidden, false);
  assert.equal(ids['song-player'].dataset.playback, 'video'); assert.equal(ids['song-video-frame'].children.length, 1);
  assert.equal(ids['song-video-frame'].children[0].src, 'https://www.youtube.com/embed/yCjJyiqpAuU?playsinline=1&rel=0');
  ids['song-use-audio'].handlers.click(); assert.equal(ids['song-video-frame'].children.length, 0); assert.equal(audio.hidden, false);
  await ids['song-original'].handlers.click(); assert.equal(audio.paused, false);
  assert.match(fs.readFileSync('index.html','utf8'), /<button id="song-original"[^>]*type="button"/);
  audio.currentTime = songs[0].lines[2][0]; audio.handlers.timeupdate(); assert.equal(ids['song-lyrics'].children[2].attributes['aria-current'], 'true');
  await ids['song-lyrics'].children[3].handlers.click(); assert.equal(audio.currentTime, songs[0].lines[3][0]);
  ids['song-speed'].value = '0.75'; ids['song-speed'].handlers.change(); assert.equal(audio.playbackRate, 0.75);
  ids['song-loop'].handlers.change(); assert.equal(audio.loop, true);
  ids['song-translation'].checked = false; ids['song-translation'].handlers.change(); assert.equal(ids['song-lyrics'].classList.contains('hide-translation'), true);
  ids['song-list'].children[1].handlers.click(); assert.equal(audio.paused, true); assert.match(audio.src, /mary/); assert.equal(ids['song-lyrics'].children.length, songs[1].lines.length);
  ids['song-use-video'].handlers.click(); assert.match(ids['song-video-frame'].children[0].src, /N7Z2Un0oxow/);
  await ids['song-play'].handlers.click(); ids['show-study'].handlers.click(); assert.equal(audio.paused, true); assert.equal(study.hidden, false);
  assert.equal(ids['song-video-frame'].children.length, 0);
  sandbox.recording = true; ids['show-songs'].handlers.click(); assert.equal(ids['songs-panel'].hidden, true);
  await ids['song-play'].handlers.click(); assert.equal(audio.paused, true); assert.match(ids['song-status'].textContent, /麦克风/);
  ids['song-use-video'].handlers.click(); assert.equal(ids['song-video-frame'].children.length, 0);
  sandbox.recording = false; audio.play = () => Promise.reject(new Error('decode')); await ids['song-play'].handlers.click(); assert.match(ids['song-status'].textContent, /无法播放/);
  assert.equal(fs.readFileSync('songs-player.js','utf8').includes('speechSynthesis'), false);
  console.log('PASS: complete accompanied MP3 recordings pinned by hash, bilingual cues, selection, playback, seeking, highlight, speed, loop, translation toggle, view changes and microphone exclusion.');
})().catch(error => { console.error(error); process.exitCode = 1; });
