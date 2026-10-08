const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function element(extra = {}) {
  return Object.assign({ textContent: '', value: '', hidden: false, children: [], handlers: {}, dataset: {}, style: { setProperty() {} }, classList: { toggle() {}, add() {}, remove() {} }, setAttribute() {}, addEventListener(name, fn) { this.handlers[name] = fn; }, appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, focus() {}, scrollIntoView() {} }, extra);
}
function setup({ recognition = true, saved = null, protocol = 'http:' } = {}) {
  const ids = {};
  for (const match of fs.readFileSync('index.html', 'utf8').matchAll(/id="([^"]+)"/g)) ids[match[1]] = element();
  ids['speech-rate'].value = '1';
  ids.spelling.value = '';
  Object.assign(ids.canvas, { width: 600, height: 400, getContext: () => ({ clearRect() {} }) });
  const colors = ['#ed4545', '#f4bd24', '#3884ea', '#35a96e'].map(color => element({ dataset: { color }, textContent: 'color' }));
  let timers = [], stored = saved, spoken = [], session;
  const speech = { getVoices: () => [{ lang: 'en-US' }], addEventListener() {}, cancel() {}, speak(u) { spoken.push(u); queueMicrotask(() => u.onend()); } };
  class Recognition { constructor() { session = this; } start() {} stop() {} abort() {} }
  const context = { document: { getElementById: id => ids[id], querySelectorAll: () => colors, createElement: () => element(), createElementNS: () => element(), createTextNode: text => ({ textContent: text }) }, window: { speechSynthesis: speech, SpeechSynthesisUtterance: true, matchMedia: () => ({ matches: true }), location: { protocol } }, localStorage: { getItem: () => stored, setItem: (_, value) => { stored = value; } }, SpeechSynthesisUtterance: function(text) { this.text = text; }, setTimeout(fn, ms) { const t = { fn, ms }; timers.push(t); return t; }, clearTimeout(t) { timers = timers.filter(item => item !== t); }, Promise, Math };
  if (recognition) context.window.SpeechRecognition = Recognition;
  vm.createContext(context); vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
  return { ids, context, spoken, get session() { return session; }, get saved() { return stored; }, async flush() { for (let i = 0; i < 100; i++) { await Promise.resolve(); const short = timers.filter(t => t.ms < 12000); timers = timers.filter(t => t.ms >= 12000); short.forEach(t => t.fn()); } }, transcript(text) { const result = [{ transcript: text }]; result.isFinal = true; session.onresult({ resultIndex: 0, results: [result] }); } };
}
const submit = app => app.ids['answer-form'].handlers.submit({ preventDefault() {} });
(async () => {
  const app = setup(); const { ids } = app;
  assert.equal(ids.practice.hidden, false);
  assert.equal(ids.spelling.disabled, false);
  assert.equal(ids.done.disabled, true);
  ids['pet-options'].children[0].handlers.click();
  assert.equal(ids.done.disabled, false);
  ids.done.handlers.click(); await app.flush();
  assert.deepEqual(app.spoken.map(u => u.text), ['Apple', 'A', 'P', 'P', 'L', 'E', 'Apple']);
  assert.ok(app.spoken.every(u => u.rate === 1 && u.lang === 'en-US'));
  assert.equal(ids.spelling.disabled, false);
  assert.equal(ids.record.disabled, false);
  ids.spelling.value = 'Apple'; submit(app); assert.equal(ids.points.textContent, '⭐ 0');
  ids.record.handlers.click(); app.transcript('Cat'); submit(app); assert.equal(ids.points.textContent, '⭐ 0');
  ids.record.handlers.click(); app.transcript('Apple.');
  ids.spelling.value = 'ap ple'; submit(app); assert.equal(ids.points.textContent, '⭐ 0');
  ids.spelling.value = ' APPLE '; submit(app); assert.equal(ids.points.textContent, '⭐ 10');
  submit(app); assert.equal(ids.points.textContent, '⭐ 10');
  ids['food-options'].children[2].handlers.click(); assert.equal(ids.points.textContent, '⭐ 10');
  ids['food-options'].children[0].handlers.click(); assert.equal(ids.points.textContent, '⭐ 5');
  assert.equal(JSON.parse(app.saved).growth, 5);
  await app.flush(); ids['next-level'].handlers.click(); assert.equal(ids['lesson-word'].textContent, 'Cat');
  const restored = setup({ saved: app.saved }); assert.equal(restored.ids.points.textContent, '⭐ 5'); assert.equal(restored.ids['lesson-word'].textContent, 'Cat');
  assert.equal(ids.practice.hidden, false);
  const direct = setup(); direct.ids['pet-options'].children[0].handlers.click(); direct.ids.repeat.handlers.click(); await direct.flush(); direct.ids.record.handlers.click(); direct.transcript('Apple'); direct.ids.spelling.value = 'apple'; submit(direct); assert.equal(direct.ids.points.textContent, '⭐ 10');
  ids.done.handlers.click(); await app.flush(); ids.record.handlers.click(); app.session.onerror({ error: 'not-allowed' });
  assert.equal(ids['check-answer'].disabled, false); assert.equal(ids.spelling.disabled, false); assert.match(ids['recognition-status'].textContent, /权限/);
  const unsupported = setup({ recognition: false }); unsupported.ids['pet-options'].children[0].handlers.click(); unsupported.ids.done.handlers.click(); await unsupported.flush();
  assert.equal(unsupported.ids.record.disabled, true); submit(unsupported); assert.equal(unsupported.ids.points.textContent, '⭐ 0');
  ids.record.handlers.click(); app.session.onaudiostart(); assert.match(ids['recognition-status'].textContent, /已开始收音/); app.session.onspeechstart(); assert.match(ids['recognition-status'].textContent, /听到你的声音/); app.session.onerror({ error: 'network' }); assert.equal(ids.spelling.disabled, false); assert.match(ids['recognition-status'].textContent, /服务连接失败/);
  const slow = setup(); slow.ids['speech-rate'].value = '0.6'; slow.ids['pet-options'].children[0].handlers.click(); slow.ids.done.handlers.click(); await slow.flush(); assert.equal(slow.spoken[0].rate, 0.6); assert.ok(slow.spoken.slice(1, -1).every(u => u.rate === 1));
  const fileApp = setup({ protocol: 'file:' }); fileApp.ids['pet-options'].children[0].handlers.click(); fileApp.ids.done.handlers.click(); await fileApp.flush(); assert.equal(fileApp.ids.record.disabled, false); assert.equal(fileApp.ids.record.textContent, '打开跟读页面 →'); assert.equal(fileApp.ids.spelling.disabled, false);
  let destination; fileApp.context.window.location.assign = url => { destination = url; }; fileApp.ids.record.handlers.click(); assert.equal(destination, 'http://127.0.0.1:8765/#practice');
  console.log('PASS: normal-speed letters, independent spelling, reward gates, pet economy, persistence, microphone capture events and service failure.');
})().catch(error => { console.error(error); process.exitCode = 1; });
