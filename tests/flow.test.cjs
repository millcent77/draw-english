const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function element(extra = {}) {
  return Object.assign({ textContent: '', value: '', hidden: false, children: [], handlers: {}, dataset: {}, style: { setProperty(name, value) { this[name] = value; } }, classList: { toggle() {}, add() {}, remove() {} }, setAttribute(name, value) { (this.attributes ||= {})[name] = value; }, addEventListener(name, fn) { const previous = this.handlers[name]; this.handlers[name] = previous ? (...args) => { previous(...args); return fn(...args); } : fn; }, appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, focus() {}, scrollIntoView() {} }, extra);
}
function setup({ recognition = true, saved = null, protocol = 'http:', learning = false, courseSaved = null, drawingSaved = null, speechSaved = null } = {}) {
  const ids = {};
  for (const match of fs.readFileSync('index.html', 'utf8').matchAll(/id="([^"]+)"/g)) ids[match[1]] = element();
  ids['speech-rate'].value = '1';
  ids.spelling.value = '';
  const drawingContext = { clearRect() {}, beginPath() {}, arc(x, y, radius) { this.radius = radius; }, fill() {}, moveTo() {}, lineTo() {}, stroke() {} };
  Object.assign(ids.canvas, { width: 600, height: 400, getContext: () => drawingContext });
  const colors = ['#ed4545', '#f4bd24', '#3884ea', '#35a96e'].map(color => element({ dataset: { color }, textContent: 'color' }));
  ids.celebration.hidden = true;
  let timers = [], stored = saved, spoken = [], session; const courseStore = { 'draw-say-courses-v1': courseSaved, 'draw-say-drawing-v1': drawingSaved, 'draw-say-speech-v1': speechSaved };
  const speech = { getVoices: () => [{ lang: 'en-US' }], addEventListener() {}, cancel() {}, speak(u) { spoken.push(u); queueMicrotask(() => u.onend()); } };
  class Recognition { constructor() { session = this; } start(track) { this.track = track; } stop() {} abort() { this.onerror?.({ error: 'aborted' }); } }
  const context = { document: { getElementById: id => ids[id], querySelector: () => (ids.lesson ||= element()), querySelectorAll: () => colors, createElement: tag => { const node = element({naturalWidth:793,naturalHeight:1983}); if (tag === 'canvas') node.getContext = () => ({clearRect(){},save(){},restore(){},translate(){},scale(){},drawImage(...args){(node.drawnFrames ||= []).push(args);}}); if (tag === 'img') Object.defineProperty(node, 'src', { set(value) { this.source = value; this.handlers.load?.(); }, get() { return this.source; } }); return node; }, createElementNS: () => element(), createTextNode: text => ({ textContent: text }) }, window: { speechSynthesis: speech, SpeechSynthesisUtterance: true, matchMedia: () => ({ matches: true }), location: { protocol } }, localStorage: { getItem: key => key === 'draw-say-pet-v1' ? stored : courseStore[key], setItem: (key, value) => { if (key === 'draw-say-pet-v1') stored = value; else courseStore[key] = value; } }, SpeechSynthesisUtterance: function(text) { this.text = text; }, setTimeout(fn, ms) { const t = { fn, ms }; timers.push(t); return t; }, clearTimeout(t) { timers = timers.filter(item => item !== t); }, Promise, Math };
  if (recognition) context.window.SpeechRecognition = Recognition;
  vm.createContext(context); vm.runInContext(fs.readFileSync('pets.js', 'utf8'), context); vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
  if (learning) { vm.runInContext(fs.readFileSync('curriculum.js', 'utf8'), context); vm.runInContext(fs.readFileSync('english-translations.js', 'utf8'), context); vm.runInContext(fs.readFileSync('drawing-tasks.js', 'utf8'), context); vm.runInContext(fs.readFileSync('learning.js', 'utf8'), context); }
  return { ids, context, spoken, get session() { return session; }, get saved() { return stored; }, get courseSaved() { return courseStore['draw-say-courses-v1']; }, get drawingSaved() { return courseStore['draw-say-drawing-v1']; }, get speechSaved() { return courseStore['draw-say-speech-v1']; }, async flush() { for (let i = 0; i < 100; i++) { await Promise.resolve(); const short = timers.filter(t => t.ms < 12000); timers = timers.filter(t => t.ms >= 12000); short.forEach(t => t.fn()); } }, transcript(text) { const result = [{ transcript: text }]; result.isFinal = true; session.onresult({ resultIndex: 0, results: [result] }); } };
}
assert.equal((fs.readFileSync('index.html', 'utf8').match(/src="learning.js"/g) || []).length, 1);
const submit = app => app.ids['answer-form'].handlers.submit({ preventDefault() {} });
(async () => {
  const app = setup(); const { ids } = app;
  const drawingContext = ids.canvas.getContext('2d');
  const drawStroke = () => vm.runInContext('draw({x:10,y:10},{x:20,y:20})', app.context);
  drawStroke(); assert.equal(drawingContext.lineWidth, 12);
  for (const width of [4, 8, 12, 24]) {
    ids['brush-size'].value = String(width); ids['brush-size'].handlers.change();
    drawStroke(); assert.equal(drawingContext.lineWidth, width);
    vm.runInContext('draw({x:10,y:10},{x:10,y:10})', app.context);
    assert.equal(drawingContext.radius, width / 2);
  }
  ids.eraser.handlers.click(); drawStroke(); assert.equal(drawingContext.lineWidth, 32);
  assert.equal(drawingContext.globalCompositeOperation, 'destination-out');
  vm.runInContext('colors[0].handlers.click()', app.context); drawStroke();
  assert.equal(drawingContext.lineWidth, 24); assert.equal(drawingContext.globalCompositeOperation, 'source-over');
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
  const slow = setup(); slow.ids['speech-rate'].value = '0.6'; slow.ids['pet-options'].children[0].handlers.click(); slow.ids.done.handlers.click(); await slow.flush(); assert.equal(slow.spoken[0].rate, 0.8); assert.ok(slow.spoken.slice(1, -1).every(u => u.rate === 1));
  const nativeVoices = [{lang:'zh-CN',name:'Chinese',voiceURI:'zh'}, {lang:'en-GB',name:'English UK',voiceURI:'uk'}, {lang:'en-US',name:'English US',voiceURI:'us'}, {lang:'en-US',name:'English US Natural',voiceURI:'natural'}];
  const native = setup(); native.context.window.speechSynthesis.getVoices=()=>nativeVoices;
  vm.runInContext('loadVoices()',native.context);
  assert.equal(native.ids['speech-voice'].children.length,4);
  let reading=vm.runInContext("speakText('Apple')",native.context); await native.flush(); await reading;
  assert.equal(native.spoken.at(-1).voice.voiceURI,'natural');
  native.ids['speech-voice'].value='uk'; native.ids['speech-voice'].handlers.change();
  native.ids['speech-rate'].value='0.9'; native.ids['speech-rate'].handlers.change();
  reading=vm.runInContext("speakText('A red apple.')",native.context); await native.flush(); await reading;
  assert.equal(native.spoken.at(-1).lang,'en-GB'); assert.equal(native.spoken.at(-1).rate,.9);
  const speechRestored=setup({speechSaved:native.speechSaved});
  speechRestored.context.window.speechSynthesis.getVoices=()=>nativeVoices; vm.runInContext('loadVoices()',speechRestored.context);
  assert.equal(speechRestored.ids['speech-voice'].value,'uk'); assert.equal(speechRestored.ids['speech-rate'].value,'0.9');
  const sentences = setup(); vm.runInContext("levels[0].word='I can see a red apple.'", sentences.context);
  sentences.ids.repeat.handlers.click(); await sentences.flush();
  assert.deepEqual(sentences.spoken.map(u=>u.text),['I can see a red apple.']);
  const missingVoice=setup(); missingVoice.context.window.speechSynthesis.getVoices=()=>[{lang:'zh-CN',name:'Chinese'}];
  reading=vm.runInContext("speakText('Apple')",missingVoice.context); await missingVoice.flush();
  assert.equal(await reading,false); assert.equal(missingVoice.spoken.length,0);
  assert.match(missingVoice.ids['voice-status'].textContent,/无英语/);
  const delayedVoice=setup(); let voiceChecks=0;
  delayedVoice.context.window.speechSynthesis.getVoices=()=>++voiceChecks<4?[]:[nativeVoices[1]];
  reading=vm.runInContext("speakText('Apple')",delayedVoice.context); await delayedVoice.flush();
  assert.equal(await reading,true); assert.equal(delayedVoice.spoken[0].lang,'en-GB');
  const longSpeech=setup(); const speechTimeouts=[]; const speechTimer=longSpeech.context.setTimeout;
  longSpeech.context.setTimeout=(fn,ms)=>{speechTimeouts.push(ms);return speechTimer(fn,ms);};
  reading=vm.runInContext(`speakText(${JSON.stringify('This is a longer English sentence. '.repeat(20))})`,longSpeech.context);
  await longSpeech.flush(); await reading;
  assert.ok(speechTimeouts.some(ms=>ms>12000 && ms<=120000));
  console.log('PASS: English-only voice choice, stored accent/speed, delayed voices and sentence playback.');
  const fileApp = setup({ protocol: 'file:' }); fileApp.ids['pet-options'].children[0].handlers.click(); fileApp.ids.done.handlers.click(); await fileApp.flush(); assert.equal(fileApp.ids.record.disabled, false); assert.equal(fileApp.ids.record.textContent, '🎤 开始跟读'); assert.equal(fileApp.ids.spelling.disabled, false);
  let destination; fileApp.context.window.location.assign = url => { destination = url; };
  await fileApp.ids.record.handlers.click(); assert.equal(destination, 'draw-say://practice');
  assert.match(fileApp.ids['recognition-status'].textContent, /自动启动/);
  assert.equal(fileApp.ids.spelling.disabled, false);
  destination = undefined;
  await fileApp.ids['test-mic'].handlers.click(); assert.equal(destination, 'draw-say://practice');
  assert.match(fileApp.ids['mic-status'].textContent, /自动启动/);
  const mic = setup(); let stoppedTracks = 0, constraints;
  const track = { stop() { stoppedTracks++; } };
  mic.context.navigator = { mediaDevices: { async getUserMedia(options) { constraints = options; return { getAudioTracks: () => [track], getTracks: () => [track] }; }, async enumerateDevices() { throw new Error('Default input must not enumerate devices'); } } };
  assert.equal(mic.ids['mic-device'], undefined);
  await mic.ids['test-mic'].handlers.click(); assert.equal(constraints.audio, true); assert.equal(mic.ids.record.disabled, true); mic.ids['test-mic'].handlers.click(); assert.equal(stoppedTracks, 1);
  mic.ids['pet-options'].children[0].handlers.click(); mic.ids.repeat.handlers.click(); await mic.flush(); await mic.ids.record.handlers.click(); assert.equal(mic.session.track, track); assert.equal(constraints.audio,true); assert.equal(mic.session.continuous, true); assert.equal(mic.session.interimResults, true);
  const interim = [{ transcript: 'Apple' }]; interim.isFinal = false; mic.session.onresult({ results: [interim], resultIndex: 0 }); mic.ids.spelling.value = 'apple'; submit(mic); assert.equal(mic.ids.points.textContent, '⭐ 0');
  mic.session.onspeechstart(); mic.session.onerror({ error: 'no-speech' }); assert.match(mic.ids['recognition-status'].textContent, /不代表你没有读/); assert.equal(stoppedTracks, 2);
  await mic.ids.record.handlers.click(); mic.transcript('Apple'); assert.equal(stoppedTracks, 3); submit(mic); assert.equal(mic.ids.points.textContent, '⭐ 10');
  const course = setup({ learning: true });
  course.ids['pet-options'].children[0].handlers.click();
  course.ids.difficulty.value = 'medium'; course.ids.difficulty.handlers.change();
  assert.equal(course.ids['lesson-word'].textContent, 'Red apple');
  course.ids.difficulty.value = 'hard'; course.ids.difficulty.handlers.change();
  assert.equal(course.ids['lesson-word'].textContent, 'Read & answer');
  assert.equal(course.ids.guide.style.opacity, '0');
  course.ids.subject.value = 'math'; course.ids.subject.handlers.change();
  assert.equal(course.ids.practice.hidden, true);
  course.ids['math-answer'].value = '3'; course.ids['math-form'].handlers.submit({ preventDefault() {} });
  assert.equal(course.ids.points.textContent, '⭐ 20');
  course.ids['math-form'].handlers.submit({ preventDefault() {} }); assert.equal(course.ids.points.textContent, '⭐ 20');
  course.ids['math-next'].handlers.click(); assert.match(course.ids['math-title'].textContent, /฿/);
  for (const stage of ['1','2','3','4','5','6']) for (const subject of ['english', 'math']) for (const difficulty of ['easy','medium','hard']) {
    course.ids['school-stage'].value = stage; course.ids.subject.value = subject; course.ids.difficulty.value = difficulty; course.ids.subject.handlers.change();
    const list = vm.runInContext(subject === 'math' ? 'mathCourses[learning.difficulty]' : 'courses[learning.difficulty]', course.context);
    assert.ok(list.length >= 12);
    if (subject === 'math') for (const q of list) {
      assert.ok(Number.isFinite(q.answer));
      assert.equal(vm.runInContext(`matchesMathAnswer(${JSON.stringify(String(q.answer))},${q.answer})`, course.context),true);
    }
  }
  assert.equal(vm.runInContext('matchesMathAnswer("2/4", .5)', course.context),true);
  for (const bad of ['', '1/0', 'Infinity', '0.5x', '1+1']) assert.equal(vm.runInContext(`matchesMathAnswer(${JSON.stringify(bad)},.5)`,course.context),false);
  const migrated = setup({ learning: true, courseSaved: JSON.stringify({subject:'math',difficulty:'easy',positions:{'math:easy':4}}) });
  assert.match(migrated.ids['math-progress'].textContent, /第 5 题/);
  migrated.ids['age-group'].value = '10'; migrated.ids['age-group'].handlers.change({target:{id:'age-group'}});
  assert.match(migrated.ids['math-progress'].textContent, /第 1 题/);
  migrated.ids['age-group'].value = '6-7'; migrated.ids['age-group'].handlers.change({target:{id:'age-group'}});
  assert.match(migrated.ids['math-progress'].textContent, /第 5 题/);
  const ageRestored = setup({ learning: true, courseSaved: migrated.courseSaved });
  assert.equal(ageRestored.ids['age-group'].value, '6-7'); assert.match(ageRestored.ids['math-progress'].textContent, /第 5 题/);
  for (const [growth, phase, unlocked] of [[0, '出生期', 1], [29, '出生期', 1], [30, '幼年期', 2], [89, '幼年期', 2], [90, '探索期', 3], [179, '探索期', 3], [180, '青年期', 4], [270, '成熟期', 5], [420, '达人期', 6], [570, '守护期', 7], [870, '传奇期', 8]]) {
    const petApp = setup({ saved: JSON.stringify({ pet: 'rabbit', points: 20, growth, level: 0 }) });
    assert.match(petApp.ids['pet-stage'].textContent, new RegExp(phase));
    assert.equal(petApp.ids['pet-actions'].children.filter(button => !button.disabled).length, unlocked);
    assert.equal(petApp.ids['pet-avatar'].dataset.pet, 'rabbit');
    petApp.ids['pet-actions'].children[3].handlers.click();
    assert.equal(petApp.ids['pet-avatar'].attributes['data-motion'], unlocked >= 4 ? 'dance' : '');
  }
  const evolving = setup({ saved: JSON.stringify({ pet: 'dog', points: 10, growth: 25, level: 0 }) });
  evolving.ids['food-options'].children[0].handlers.click();
  assert.match(evolving.ids['pet-stage'].textContent, /幼年期/);
  assert.equal(evolving.ids['pet-avatar'].attributes['data-motion'], 'eat');
  assert.equal(JSON.parse(evolving.saved).growth, 30);
  const touch = setup();
  touch.ids['pet-avatar'].handlers.click(); assert.equal(touch.ids.points.textContent, '⭐ 0');
  touch.ids['pet-options'].children[0].handlers.click();
  touch.ids['pet-avatar'].handlers.click(); assert.equal(touch.ids['pet-avatar'].attributes['data-motion'], 'cuddle');
  touch.ids['pet-avatar'].handlers.click(); assert.equal(touch.ids['pet-avatar'].attributes['data-motion'], 'blink');
  assert.equal(touch.ids.points.textContent, '⭐ 0'); assert.equal(JSON.parse(touch.saved).growth, 0);
  for (const [difficulty, reward, word] of [['easy', 10, 'Apple'], ['medium', 15, 'Red apple'], ['hard', 20, 'An apple']]) {
    const graded = setup({ learning: true }); graded.ids['pet-options'].children[0].handlers.click();
    graded.ids.difficulty.value = difficulty; graded.ids.difficulty.handlers.change();
    assert.match(graded.ids['check-answer'].textContent, new RegExp(`\\+${reward}`));
    assert.equal(graded.ids['english-answer-translation'].hidden,true);
    assert.ok(graded.ids['english-translation-details'].children.length >= 3);
    graded.ids.repeat.handlers.click(); await graded.flush();
    graded.ids.record.handlers.click(); graded.transcript(word); graded.ids.spelling.value = word;
    submit(graded); assert.equal(graded.ids.points.textContent, `⭐ ${reward}`);
    if (difficulty === 'hard') { assert.equal(graded.ids['english-answer-translation'].hidden,false); assert.match(graded.ids['english-answer-translation'].children[1].textContent,/一个苹果/); }
    submit(graded); assert.equal(graded.ids.points.textContent, `⭐ ${reward}`);
  }
  const drawing = setup({ learning: true }); drawing.ids['pet-options'].children[0].handlers.click();
  drawing.ids.subject.value = 'math'; drawing.ids.subject.handlers.change();
  assert.match(drawing.ids.difficulty.children[0].textContent,/Foundation/);
  drawing.ids['practice-mode'].value = 'fractions'; drawing.ids['practice-mode'].handlers.change();
  const checkDrawing = () => drawing.ids['drawing-form'].handlers.submit({ preventDefault() {} });
  drawing.ids['drawing-answer'].value = '1/4'; checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 0');
  drawing.ids['drawing-board'].children[0].handlers.click(); drawing.ids['drawing-board'].children[1].handlers.click(); checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 0');
  drawing.ids['drawing-board'].children[1].handlers.click(); checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 10');
  checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 10');
  drawing.ids['drawing-next'].handlers.click(); assert.equal(drawing.ids['drawing-title'].textContent,'2/4');
  drawing.ids['practice-mode'].value='geometry'; drawing.ids['practice-mode'].handlers.change();
  drawing.ids['drawing-answer'].value='3';
  for (const index of [0,8,16]) drawing.ids['drawing-board'].children[index].handlers.click();
  checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 10');
  drawing.ids['drawing-clear'].handlers.click();
  for (const index of [0,1,2]) drawing.ids['drawing-board'].children[index].handlers.click();
  drawing.ids['drawing-answer'].value='7'; checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 10');
  drawing.ids['drawing-answer'].value='3'; checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 20');
  drawing.ids['drawing-next'].handlers.click();
  assert.equal(vm.runInContext('drawingQuestion.answer',drawing.context),8); // stage 2: 4x2 array count
  drawing.ids.subject.value='english'; drawing.ids.subject.handlers.change();
  drawing.ids['practice-mode'].value='listening'; drawing.ids['practice-mode'].handlers.change();
  checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 20');
  await drawing.ids['drawing-listen'].handlers.click();
  drawing.ids['drawing-board'].children[0].handlers.click(); drawing.ids['drawing-board'].children[1].handlers.click(); checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 20');
  drawing.ids['drawing-clear'].handlers.click(); drawing.ids['drawing-color'].value='blue';
  drawing.ids['drawing-board'].children[11].handlers.click(); drawing.ids['drawing-board'].children[12].handlers.click(); checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 20');
  drawing.ids['drawing-clear'].handlers.click(); drawing.ids['drawing-color'].value='red'; drawing.ids['drawing-shape'].value='square';
  drawing.ids['drawing-board'].children[11].handlers.click(); drawing.ids['drawing-board'].children[12].handlers.click(); checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 20');
  drawing.ids['drawing-clear'].handlers.click(); drawing.ids['drawing-shape'].value='circle';
  drawing.ids['drawing-board'].children[11].handlers.click(); drawing.ids['drawing-board'].children[12].handlers.click(); checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 30');
  checkDrawing(); assert.equal(drawing.ids.points.textContent,'⭐ 30');
  drawing.ids['practice-mode'].value='standard'; drawing.ids['practice-mode'].handlers.change();
  assert.equal(drawing.ids['free-canvas'].hidden,false); assert.equal(drawing.ids.practice.hidden,false);
  const drawRestored = setup({ learning:true, courseSaved:drawing.courseSaved, drawingSaved:drawing.drawingSaved, saved:drawing.saved });
  drawRestored.ids.subject.value='math'; drawRestored.ids.subject.handlers.change();
  drawRestored.ids['practice-mode'].value='fractions'; drawRestored.ids['practice-mode'].handlers.change();
  assert.equal(drawRestored.ids['drawing-title'].textContent,'2/4');
  assert.equal(drawRestored.ids.points.textContent,'⭐ 30');
  for (const subject of ['english','math']) for (const difficulty of ['easy','medium','hard']) {
    const signatures=[];
    for (const stage of ['1','2','3','4','5','6']) {
      signatures.push(vm.runInContext(`JSON.stringify(${subject === 'math' ? 'mathBanks' : 'englishBanks'}['${stage}']['${difficulty}'])`,course.context));
    }
    assert.equal(new Set(signatures).size,6, `${subject}/${difficulty} must have six distinct banks`);
  }
  assert.equal(vm.runInContext('matchesMathAnswer("-5", -5)',course.context),true);
  const stage5fraction=vm.runInContext('makeDrawingQuestion("fractions",0,"easy","5")',course.context);
  assert.equal(stage5fraction.answer,10); assert.match(stage5fraction.title,/%/);
  const stage6fraction=vm.runInContext('makeDrawingQuestion("fractions",0,"easy","6")',course.context);
  assert.equal(stage6fraction.answer,3); assert.match(stage6fraction.title,/of 15/);
  const stage5geometry=vm.runInContext('makeDrawingQuestion("geometry",0,"easy","5")',course.context);
  assert.equal(stage5geometry.answer,3); // 6x2 cells, side .5 -> area 3
  const stage3listen=vm.runInContext('makeDrawingQuestion("listening",2,"easy","3")',course.context);
  assert.equal(stage3listen.region,'left');
  assert.equal(vm.runInContext('inDrawingRegion(0,"left") && !inDrawingRegion(4,"left")',course.context),true);
  migrated.ids['school-stage'].value='5'; migrated.ids['school-stage'].handlers.change();
  const stageRestored=setup({ learning:true, courseSaved:migrated.courseSaved }); assert.equal(stageRestored.ids['school-stage'].value,'5');
  for (const stage of ['1','2','3','4']) {
    const questions=vm.runInContext(`Object.values(mathBanks['${stage}']).flat()`,course.context);
    assert.ok(questions.every(q=>!/[0-9]\.[0-9]|%/.test(q.title)), `stage ${stage} must not introduce decimal/percent operations`);
  }
  const translations=vm.runInContext('englishTranslations',course.context);
  for (const stage of ['1','2','3','4','5','6']) {
    assert.equal(translations[stage].length,12);
    for (const row of translations[stage]) {
      assert.equal(row.length,10);
      row.forEach((text,index)=>assert.match(text,index%2 ? /[\u0E00-\u0E7F]/ : /[\u4E00-\u9FFF]/));
    }
  }
  const translated=setup({learning:true}); translated.ids['pet-options'].children[0].handlers.click();
  assert.match(translated.ids['english-translation-details'].children[1].textContent,/苹果/);
  assert.match(translated.ids['english-translation-details'].children[2].textContent,/แอปเปิล/);
  translated.ids.difficulty.value='hard'; translated.ids.difficulty.handlers.change();
  assert.equal(translated.ids['english-answer-translation'].hidden,true);
  assert.match(translated.ids['passage-translation-body'].children[1].textContent,/午餐/);
  translated.ids.spelling.value='An apple'; submit(translated); assert.equal(translated.ids['english-answer-translation'].hidden,true);
  translated.ids.repeat.handlers.click(); await translated.flush(); translated.ids.record.handlers.click(); translated.transcript('An apple'); submit(translated);
  assert.equal(translated.ids['english-answer-translation'].hidden,false);
  await translated.flush(); translated.ids['next-level'].handlers.click();
  assert.equal(translated.ids['english-answer-translation'].hidden,true);
  assert.match(translated.ids['passage-translation-body'].children[1].textContent,/小猫/);
  const switching=setup({saved:JSON.stringify({pet:'cat',points:55,growth:450,level:2})});
  switching.ids['change-pet'].handlers.click(); assert.equal(switching.ids['pet-picker'].hidden,false);
  switching.ids['cancel-pet-change'].handlers.click(); assert.equal(switching.ids['pet-picker'].hidden,true); assert.equal(JSON.parse(switching.saved || '{}').pet,'cat');
  switching.ids['change-pet'].handlers.click(); switching.ids['pet-options'].children[1].handlers.click();
  assert.equal(switching.ids['pet-avatar'].dataset.pet,'dog'); assert.equal(switching.ids['pet-picker'].hidden,true);
  const switched=JSON.parse(switching.saved);assert.equal(switched.points,55);assert.equal(switched.growth,450);assert.equal(switched.level,2);
  assert.match(switching.ids['pet-stage'].textContent,/达人期/);
  switching.ids['change-pet'].handlers.click(); assert.equal(switching.ids['pet-picker-backdrop'].hidden,false);
  switching.ids['pet-picker'].handlers.keydown({key:'Escape',preventDefault(){}});assert.equal(switching.ids['pet-picker'].hidden,true);
  for (const pet of ['cat','dog','rabbit','panda']) {
    const png=fs.readFileSync(`assets/pet-${pet}.png`); assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(png.readUInt32BE(16),png.readUInt32BE(20)*2); assert.ok(png.readUInt32BE(16)>=1024);
  }
  console.log('PASS: adoption switch/cancel preserves points, growth and course position.');
  const motion = setup({saved:JSON.stringify({pet:'cat',points:100,growth:900,level:0})});
  for (const move of ['blink','wave','jump','dance','stretch','spin','glow','cheer','eat','cuddle']) {
    vm.runInContext(`playPetMove('${move}')`, motion.context);
    assert.equal(motion.ids['pet-avatar'].attributes['data-motion'], move);
    assert.ok(motion.ids['pet-action-status'].textContent);
  }
  assert.equal(motion.ids['pet-avatar'].attributes['data-animating'], 'true');
  assert.equal(motion.ids['pet-avatar'].style['--action-y'], '100%');
  await motion.flush();
  assert.equal(motion.ids['pet-avatar'].attributes['data-animating'], 'false');
  motion.context.window.matchMedia = () => ({ matches:false });
  vm.runInContext("playPetMove('spin'); playPetMove('eat')", motion.context);
  assert.equal(motion.ids['pet-avatar'].style['--action-y'], `${8 * 100 / 9}%`);
  await motion.flush();
  assert.equal(motion.ids['pet-avatar'].attributes['data-motion'], '');
  const character = motion.ids['pet-avatar'].children[0];
  assert.equal(character.children.filter(part=>part.className === 'pet-sprite').length, 1);
  assert.equal(character.children.filter(part=>part.className === 'pet-action-sprite').length, 1);
  const preloader = character.children.find(part=>part.src?.endsWith('-actions.png'));
  preloader.handlers.error();
  vm.runInContext("playPetMove('dance')",motion.context);
  assert.equal(motion.ids['pet-avatar'].attributes['data-animating'], 'false');
  assert.match(motion.ids['pet-action-status'].textContent,/加载/);
  assert.equal(JSON.parse(motion.saved).growth, 900);
  for (const pet of ['cat','dog','rabbit','panda']) {
    const poses = setup({saved:JSON.stringify({pet,points:100,growth:900,level:0})});
    poses.context.window.matchMedia = () => ({matches:false});
    const atlas = fs.readFileSync(`assets/pet-${pet}-actions.png`);
    const width = atlas.readUInt32BE(16), height = atlas.readUInt32BE(20);
    assert.equal(width,793); assert.equal(height,1983);
    const poseCanvas = poses.ids['pet-avatar'].children[0].children.find(part=>part.className==='pet-action-sprite');
    for (const action of ['blink','wave','jump','dance','stretch','spin','glow','cheer','eat','cuddle']) {
      poseCanvas.drawnFrames = [];
      vm.runInContext(`playPetMove('${action}')`,poses.context); await poses.flush();
      assert.ok(poseCanvas.drawnFrames.length >= 4);
      for (const [,x,y,w,h,dx,dy,dw,dh] of poseCanvas.drawnFrames) {
        assert.ok(x>=0 && y>=0 && x+w<=width && y+h<=height);
        assert.ok(Math.abs(dw/dh-w/h)<1e-8, 'pose must keep its original aspect ratio');
        assert.ok(dx>=0 && dy>=0 && dx+dw<=256 && dy+dh<=256);
      }
    }
  }
  console.log('PASS: all 40 pet/action combinations use bounded, proportional full-pose frames.');
  console.log('PASS: all ten pet reactions select independently without changing growth.');
  console.log('PASS: complete Chinese/Thai coverage and answer translation visibility/reset.');
  console.log('PASS: six distinct stage banks, stage storage, decimals/percentages, scaled geometry and directions.');
  console.log('PASS: harder math, fraction painting, rectangle geometry, listening color/position and reward gates.');
  console.log('PASS: touch feedback without rewards and graded English/math rewards.');
  console.log('PASS: pet stage boundaries, action unlocks, feeding evolution and restored saves.');
  console.log('PASS: courses, math validation and single rewards.');
  console.log('PASS: normal-speed letters, independent spelling, reward gates, pet economy, persistence, microphone capture events and service failure.');
})().catch(error => { console.error(error); process.exitCode = 1; });
