const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function element(extra = {}) {
  const classes = new Set();
  return Object.assign({ children: [], handlers: {}, attributes: {}, dataset: {}, hidden: false, textContent: '', value: '', checked: true,
    classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }, contains: name => classes.has(name) },
    setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(name, fn) { this.handlers[name] = fn; }, appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }
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
vm.createContext(sandbox); vm.runInContext(fs.readFileSync('songs.js', 'utf8'), sandbox);
const songs = vm.runInContext('englishSongs', sandbox);
assert.equal(songs.length, 3);
for (const song of songs) {
  assert.ok(song.lines.every((line, i) => line[1] && line[2] && (!i || line[0] > song.lines[i - 1][0])));
  const data = fs.readFileSync(`assets/songs/${song.id}.ogg`);
  assert.equal(data.subarray(0, 4).toString(), 'OggS');
  // Verify that the locally stored Vorbis stream is long enough for every learning cue.
  const marker = data.indexOf(Buffer.from([1, ...Buffer.from('vorbis')]));
  const sampleRate = data.readUInt32LE(marker + 12);
  let granule = 0n;
  for (let offset = 0; offset < data.length;) {
    assert.equal(data.subarray(offset, offset + 4).toString(), 'OggS');
    const value = data.readBigUInt64LE(offset + 6); if (value !== 0xffffffffffffffffn) granule = value;
    const count = data[offset + 26]; let size = 0; for (let i = 0; i < count; i++) size += data[offset + 27 + i];
    offset += 27 + count + size;
  }
  assert.ok(Number(granule) / sampleRate > song.lines.at(-1)[0]);
}
(async () => {
  ids['show-songs'].handlers.click(); assert.equal(study.hidden, true); assert.equal(ids['songs-panel'].hidden, false);
  await ids['song-play'].handlers.click(); assert.equal(audio.paused, false);
  audio.currentTime = 8.1; audio.handlers.timeupdate(); assert.equal(ids['song-lyrics'].children[2].attributes['aria-current'], 'true');
  await ids['song-lyrics'].children[3].handlers.click(); assert.equal(audio.currentTime, 12);
  ids['song-speed'].value = '0.75'; ids['song-speed'].handlers.change(); assert.equal(audio.playbackRate, 0.75);
  ids['song-loop'].handlers.change(); assert.equal(audio.loop, true);
  ids['song-translation'].checked = false; ids['song-translation'].handlers.change(); assert.equal(ids['song-lyrics'].classList.contains('hide-translation'), true);
  ids['song-list'].children[1].handlers.click(); assert.equal(audio.paused, true); assert.match(audio.src, /mary/); assert.equal(ids['song-lyrics'].children.length, 8);
  await ids['song-play'].handlers.click(); ids['show-study'].handlers.click(); assert.equal(audio.paused, true); assert.equal(study.hidden, false);
  sandbox.recording = true; ids['show-songs'].handlers.click(); assert.equal(ids['songs-panel'].hidden, true);
  await ids['song-play'].handlers.click(); assert.equal(audio.paused, true); assert.match(ids['song-status'].textContent, /麦克风/);
  sandbox.recording = false; audio.play = () => Promise.reject(new Error('decode')); await ids['song-play'].handlers.click(); assert.match(ids['song-status'].textContent, /无法播放/);
  console.log('PASS: three local Vorbis recordings, bilingual cues, selection, playback, seeking, highlight, speed, loop, translation toggle, view changes and microphone exclusion.');
})().catch(error => { console.error(error); process.exitCode = 1; });
