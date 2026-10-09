'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colors = [...document.querySelectorAll('.color')];
const eraser = document.getElementById('eraser');
const status = document.getElementById('speech-status');
let ink = '#ed4545';
let erasing = false;
let activePointer = null;
let previous = null;
let completing = false;
const $ = id => document.getElementById(id);
const pets = [{ id: 'cat', name: '小橘猫', icon: '🐱' }, { id: 'dog', name: '小奶狗', icon: '🐶' }, { id: 'rabbit', name: '小白兔', icon: '🐰' }, { id: 'panda', name: '小熊猫', icon: '🐼' }];
const foods = [{ name: '小饼干', icon: '🍪', cost: 5, growth: 5 }, { name: '鲜果餐', icon: '🍓', cost: 10, growth: 12 }, { name: '爱心大餐', icon: '🍱', cost: 20, growth: 25 }];
let lessonReward = 10;
const difficultyRewards = { easy: 10, medium: 15, hard: 20 };
const storageKey = 'draw-say-pet-v1';
let account = { pet: null, points: 0, growth: 0, level: 0 };
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && pets.some(pet => pet.id === saved.pet)) account = { pet: saved.pet, points: Number.isSafeInteger(saved.points) && saved.points >= 0 ? saved.points : 0, growth: Number.isSafeInteger(saved.growth) && saved.growth >= 0 ? saved.growth : 0, level: Number.isInteger(saved.level) && saved.level >= 0 && saved.level < 4 ? saved.level : 0 };
} catch { /* Storage may be unavailable; play continues in memory. */ }
function saveAccount() {
  try { localStorage.setItem(storageKey, JSON.stringify(account)); }
  catch { $('pet-status').textContent = '浏览器无法保存进度，请保持页面打开。'; }
}
function renderPet() {
  const pet = pets.find(item => item.id === account.pet);
  renderPetCharacter(pet);
  $('pet-name').textContent = pet ? pet.name : '选一个学习小伙伴';
  $('pet-growth').textContent = `成长等级 ${Math.floor(account.growth / 30) + 1} · 距离升级还差 ${30 - account.growth % 30} 成长值`;
  $('pet-progress').value = account.growth % 30;
  $('points').textContent = `⭐ ${account.points}`;
  $('pet-picker').hidden = Boolean(pet);
  $('done').disabled = !pet || completing;
  [...$('food-options').children].forEach((button, index) => { button.disabled = !pet || account.points < foods[index].cost; });
}
pets.forEach(pet => {
  const button = document.createElement('button');
  button.type = 'button';
  const icon = document.createElement('span'); icon.textContent = pet.icon; icon.setAttribute('aria-hidden', 'true');
  button.appendChild(icon); button.appendChild(document.createTextNode(pet.name));
  button.addEventListener('click', () => { account.pet = pet.id; saveAccount(); renderPet(); $('pet-status').textContent = `${pet.name}成为你的学习伙伴啦！`; });
  $('pet-options').appendChild(button);
});
foods.forEach(food => {
  const button = document.createElement('button'); button.type = 'button';
  button.textContent = `${food.icon} ${food.name} · ${food.cost} ⭐ · 成长 +${food.growth}`;
  button.addEventListener('click', () => {
    if (!account.pet || account.points < food.cost) return;
    account.points -= food.cost; account.growth += food.growth;
    renderPet(); $('pet-status').textContent = `喂食${food.name}成功！宠物成长 +${food.growth}，谢谢你！`; saveAccount();
    playPetMove('eat');
  });
  $('food-options').appendChild(button);
});

function selectTool(button) {
  [...colors, eraser].forEach(tool => {
    const selected = tool === button;
    tool.classList.toggle('selected', selected);
    tool.setAttribute('aria-pressed', String(selected));
  });
  document.getElementById('tool-dot').style.background = erasing ? '#8771d3' : ink;
  document.getElementById('tool-status').textContent = erasing ? '橡皮擦已准备好' : `${button.textContent.trim()}画笔已准备好`;
}
colors.forEach(button => button.addEventListener('click', () => {
  ink = button.dataset.color;
  erasing = false;
  selectTool(button);
}));
eraser.addEventListener('click', () => { erasing = true; selectTool(eraser); });

function point(event) {
  const bounds = canvas.getBoundingClientRect();
  return { x: (event.clientX - bounds.left) * canvas.width / bounds.width,
    y: (event.clientY - bounds.top) * canvas.height / bounds.height };
}
function draw(from, to) {
  ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = erasing ? 32 : 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (from.x === to.x && from.y === to.y) {
    ctx.arc(to.x, to.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }
}
canvas.addEventListener('pointerdown', event => {
  if (completing || activePointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
  event.preventDefault();
  activePointer = event.pointerId;
  canvas.setPointerCapture(activePointer);
  previous = point(event);
  draw(previous, previous);
});
canvas.addEventListener('pointermove', event => {
  if (event.pointerId !== activePointer) return;
  const next = point(event);
  draw(previous, next);
  previous = next;
});
function finish(event) {
  if (event.pointerId !== activePointer) return;
  activePointer = null;
  previous = null;
}
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => canvas.addEventListener(name, finish));
document.getElementById('clear').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  status.textContent = '画板清空啦，再画一个新作品吧！';
});

// Local SVG paths are displayed underneath the drawing, so erasing never removes the guide.
const levels = [
  { word: 'Apple', translation: '苹果', icon: '🍎', color_hint: '#ed4545', guide_shape: 'M300 145 C225 100 180 160 200 235 C215 300 255 325 300 305 C345 325 385 300 400 235 C420 160 375 100 300 145 Z M300 145 Q290 105 315 80 M310 110 Q340 65 375 95 Q355 130 310 110' },
  { word: 'Cat', translation: '小猫', icon: '🐱', color_hint: '#FFA500', guide_shape: 'M220 165 L210 90 L275 130 Q300 120 325 130 L390 90 L380 165 C420 245 370 310 300 310 C230 310 180 245 220 165 Z M255 200 L255 210 M345 200 L345 210 M290 235 L310 235 L300 245 Z M300 245 Q280 270 265 250 M300 245 Q320 270 335 250 M240 235 L175 220 M240 250 L175 260 M360 235 L425 220 M360 250 L425 260' },
  { word: 'Sun', translation: '太阳', icon: '☀️', color_hint: '#f4bd24', guide_shape: 'M370 200 A70 70 0 1 1 230 200 A70 70 0 1 1 370 200 M300 65 L300 100 M300 300 L300 335 M165 200 L200 200 M400 200 L435 200 M205 105 L230 130 M370 270 L395 295 M205 295 L230 270 M370 130 L395 105' },
  { word: 'Tree', translation: '大树', icon: '🌳', color_hint: '#35a96e', guide_shape: 'M275 255 L275 335 L325 335 L325 255 M220 260 C150 250 175 180 215 170 C195 110 270 85 300 120 C345 75 415 125 390 175 C450 205 420 275 365 260 Z' }
];
let levelIndex = account.level;
function renderLevel() {
  const level = levels[levelIndex];
  document.getElementById('level-label').textContent = `第 ${levelIndex + 1} / ${levels.length} 关 · 今天画什么？`;
  document.getElementById('lesson-word').textContent = level.word;
  document.getElementById('lesson-translation').textContent = level.translation;
  document.getElementById('lesson-icon').textContent = level.icon;
  document.getElementById('lesson-prompt').textContent = `画一个属于你的${level.translation}吧！`;
  document.getElementById('color-hint').style.setProperty('--hint', level.color_hint);
  const guide = document.getElementById('guide');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', level.guide_shape);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', level.color_hint);
  path.setAttribute('stroke-width', '5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  guide.replaceChildren(path);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  erasing = false;
  ink = colors[0].dataset.color;
  selectTool(colors[0]);
  status.textContent = `轮到 ${level.word} 啦！可以跟着淡淡的线框画，也可以自由发挥。`;
}
let voices = [];
function loadVoices() { voices = window.speechSynthesis.getVoices(); }
if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
  loadVoices();
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
}
// Always settle the promise, even if a browser never emits speech events.
function speakText(text, rate = Number($('speech-rate').value) || 1) {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    status.textContent = '这个浏览器暂时不能朗读，请试试 Chrome 或 Edge。';
    return Promise.resolve(false);
  }
  window.speechSynthesis.cancel();
  loadVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.voice = voices.find(voice => voice.lang.replace('_', '-').toLowerCase() === 'en-us') || null;
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;
  return new Promise(resolve => {
    let settled = false;
    const finishSpeech = success => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(success);
    };
    const timeout = setTimeout(() => { window.speechSynthesis.cancel(); finishSpeech(false); }, 12000);
    utterance.onstart = () => { status.textContent = `仔细听：${text}`; };
    utterance.onend = () => finishSpeech(true);
    utterance.onerror = () => finishSpeech(false);
    try { window.speechSynthesis.speak(utterance); } catch { finishSpeech(false); }
  });
}
document.getElementById('speak').addEventListener('click', () => playLesson(false));

function celebrate(level) {
  document.getElementById('praise-message').textContent = `${level.word} 完成啦！你画得真棒！`;
  const confetti = document.getElementById('confetti');
  confetti.replaceChildren();
  for (let i = 0; i < 44; i++) {
    const piece = document.createElement('i');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--piece-color', ['#ed4545', '#f4bd24', '#3884ea', '#35a96e', '#7657cd'][i % 5]);
    piece.style.setProperty('--left', `${Math.random() * 100}%`);
    piece.style.setProperty('--delay', `${Math.random() * .7}s`);
    piece.style.setProperty('--drift', `${Math.random() * 160 - 80}px`);
    confetti.appendChild(piece);
  }
  document.getElementById('celebration').hidden = false;
}
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const fileMode = window.location?.protocol === 'file:';
let heard = false, readCorrect = false, rewarded = false, speaking = false, recording = false;
let recognizer = null, recordingTimer = null;
let testingMic = false, stopMicTest = null;
function microphoneConstraints() {
  const device = $('mic-device').value;
  return { audio: { ...(device ? { deviceId: { exact: device } } : {}), echoCancellation: false, noiseSuppression: false, autoGainControl: true } };
}
async function listMicrophones() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  const selected = $('mic-device').value;
  const devices = await navigator.mediaDevices.enumerateDevices();
  const defaultOption = document.createElement('option'); defaultOption.value = ''; defaultOption.textContent = '系统默认麦克风';
  $('mic-device').replaceChildren(defaultOption);
  devices.filter(device => device.kind === 'audioinput').forEach((device, index) => {
    const option = document.createElement('option'); option.value = device.deviceId; option.textContent = device.label || `麦克风 ${index + 1}`; $('mic-device').appendChild(option);
  });
  $('mic-device').value = selected;
}
function monitorMicrophone(stream) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return () => {};
  const audio = new AudioContext();
  const source = audio.createMediaStreamSource(stream), analyser = audio.createAnalyser();
  analyser.fftSize = 1024; source.connect(analyser);
  audio.resume().catch(() => {});
  const samples = new Float32Array(analyser.fftSize);
  let frame, stopped = false, peak = 0;
  function sample() {
    if (stopped) return;
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
    peak = Math.max(peak, rms);
    $('mic-meter').value = Math.min(100, Math.round(rms * 500));
    $('mic-status').textContent = peak > 0.008 ? '✓ 麦克风已有音频信号。若仍无法识别单词，问题可能在识别服务；音量跳动不代表发音正确。' : '正在收音；若说话时音量条一直为零，请换收音设备、解除静音或检查系统输入音量。';
    frame = requestAnimationFrame(sample);
  }
  sample();
  return () => { stopped = true; cancelAnimationFrame(frame); source.disconnect(); analyser.disconnect(); audio.close().catch(() => {}); $('mic-meter').value = 0; };
}
$('test-mic').addEventListener('click', async () => {
  if (testingMic) { stopMicTest?.(); return; }
  if (recording || speaking) return;
  if (fileMode) { window.location.assign('http://127.0.0.1:8765/#practice'); return; }
  if (!navigator.mediaDevices?.getUserMedia) { $('mic-status').textContent = '浏览器无法访问麦克风，请检查网址和权限。'; return; }
  testingMic = true; syncPractice();
  let stream, cleanup = () => {}, timer;
  stopMicTest = () => { clearTimeout(timer); cleanup(); stream?.getTracks().forEach(track => track.stop()); testingMic = false; stopMicTest = null; syncPractice(); };
  $('mic-status').textContent = '请允许麦克风，随后说一句话，观察音量条。';
  try {
    stream = await navigator.mediaDevices.getUserMedia(microphoneConstraints());
    if (!testingMic) { stream.getTracks().forEach(track => track.stop()); return; }
    cleanup = monitorMicrophone(stream);
    await listMicrophones().catch(() => {});
    timer = setTimeout(() => stopMicTest?.(), 10000);
  } catch (error) {
    $('mic-status').textContent = error.name === 'NotAllowedError' ? '麦克风权限被拒绝，请在浏览器网站设置和系统设置中允许麦克风。' : '无法打开所选麦克风，请换一个设备并检查连接。';
    stopMicTest?.();
  }
});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function normalizedWord(value) { return value.trim().toLowerCase(); }
function syncPractice() {
  $('speak').disabled = speaking || recording || testingMic;
  $('repeat').disabled = speaking || recording || testingMic || rewarded;
  $('record').disabled = fileMode ? false : !heard || !Recognition || speaking || testingMic || rewarded;
  $('record').textContent = fileMode ? '打开跟读页面 →' : recording ? '⏹ 停止跟读' : '🎤 开始跟读';
  $('spelling').disabled = rewarded;
  $('check-answer').disabled = speaking || recording || rewarded;
  $('speech-rate').disabled = speaking || recording;
  $('test-mic').disabled = speaking || recording;
  $('test-mic').textContent = testingMic ? '停止麦克风测试' : '检查麦克风';
  $('mic-device').disabled = recording || testingMic;
}
async function playLesson(spell) {
  if (speaking || recording || testingMic || rewarded) return;
  speaking = true; heard = false; syncPractice();
  const word = levels[levelIndex].word;
  let success = await speakText(word);
  if (success && spell) {
    await pause(250);
    for (const letter of word.toUpperCase().replace(/[^A-Z]/g, '')) {
      success = await speakText(letter, 1);
      if (!success) break;
      await pause(100);
    }
    if (success) { await pause(250); success = await speakText(word); }
  }
  speaking = false; heard = success; syncPractice();
  $('listen-step').textContent = success ? '✓ 听完啦，现在轮到你读！' : '朗读失败，请点击“再听一次”重试。';
  $('recognition-status').textContent = fileMode ? '当前是文件页面，跟读请双击“启动学习.cmd”，然后访问 http://127.0.0.1:8765。在新网址首次授权时选择“访问该网站时允许”。拼写仍可输入。' : !Recognition ? '此浏览器不支持跟读识别，请使用支持语音识别的浏览器；无法识别时不发放积分。拼写仍可练习。' : success ? '点击“开始跟读”，等待“麦克风已就绪”后说出整个单词。' : '请检查声音及英语语音设置，成功听完后才能跟读。';
  status.textContent = success ? '听完啦，慢慢跟读，不着急！' : '朗读未完成，可以再次尝试。';
}
$('done').addEventListener('click', () => {
  if (completing || !account.pet || speaking || recording) return;
  completing = true; activePointer = null; previous = null;
  $('done').disabled = true; $('practice').hidden = false;
  $('practice').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  playLesson(true);
});
$('repeat').addEventListener('click', () => playLesson(true));
$('record').addEventListener('click', async () => {
  if (fileMode) { window.location.assign('http://127.0.0.1:8765/#practice'); return; }
  if (recording) { recognizer?.abort(); return; }
  if (!heard || !Recognition || fileMode || speaking || testingMic || rewarded) return;
  readCorrect = false; recording = true; syncPractice();
  $('read-step').textContent = '正在连接麦克风…';
  $('recognition-status').textContent = '请先允许麦克风权限，等到“麦克风已就绪”再读。';
  let received = false;
  let detectedSpeech = false, micStream = null, cleanupMeter = () => {};
  const session = new Recognition(); recognizer = session;
  session.lang = 'en-US'; session.continuous = true; session.interimResults = true; session.maxAlternatives = 1;
  const stop = () => { clearTimeout(recordingTimer); cleanupMeter(); micStream?.getTracks().forEach(track => track.stop()); if (recognizer === session) { recording = false; recognizer = null; syncPractice(); } };
  session.onaudiostart = () => {
    if (recognizer !== session) return;
    $('read-step').textContent = '麦克风已就绪，轮到你读！';
    $('recognition-status').textContent = '🎤 已开始收音，请读出整个单词。';
    clearTimeout(recordingTimer);
    recordingTimer = setTimeout(() => { if (recognizer !== session) return; $('recognition-status').textContent = '未收到识别结果。请检查系统麦克风、浏览器权限和网络，再次跟读；输入框仍可使用。'; stop(); session.abort(); }, 20000);
  };
  session.onspeechstart = () => { if (recognizer === session) { detectedSpeech = true; $('recognition-status').textContent = '听到你的声音了，正在识别…'; } };
  session.onresult = event => {
    if (recognizer !== session || received) return;
    const result = event.results[event.resultIndex || 0];
    if (!result.isFinal) { $('recognition-status').textContent = `正在识别：“${result[0].transcript}”…`; return; }
    received = true;
    const transcript = result[0].transcript;
    readCorrect = normalizedWord(transcript.replace(/[.!?,]+$/g, '')) === normalizedWord(levels[levelIndex].word);
    $('recognition-status').textContent = `听到：“${transcript}”。${readCorrect ? '单词读对啦！现在用键盘拼写。' : '还没匹配上，先听一遍，再试试看。'}`;
    $('read-step').textContent = readCorrect ? '✓ 跟读正确！' : '再试一次跟读，不扣分。';
    stop(); session.stop(); if (readCorrect) $('spelling').focus();
  };
  session.onerror = event => {
    if (recognizer !== session) return;
    received = true; readCorrect = false;
    const errors = { 'not-allowed': '麦克风权限未开启。请在地址栏的网站设置中允许麦克风，检查系统麦克风权限，再重试。', 'service-not-allowed': '浏览器的语音识别服务不可用，请在支持该服务的浏览器中尝试。', 'network': '语音识别服务连接失败，可能是网络或浏览器服务不支持。允许麦克风不代表服务一定可用，拼写仍可练习。', 'audio-capture': '无法收音，请检查麦克风是否连接、被静音，或被其他程序占用。', 'no-speech': '没有识别到声音。看到“麦克风已就绪”后靠近麦克风读完整单词。', 'aborted': '跟读已停止，可以再次开始。' };
    $('recognition-status').textContent = errors[event.error] || '没有听清，请检查麦克风，再试一次。';
    if (event.error === 'no-speech') $('recognition-status').textContent = detectedSpeech ? '检测到说话，但识别服务没有返回单词。请重试或检查浏览器语音服务，不代表你没有读。' : '识别服务未检测到有效语音。请点击“检查麦克风”，观察音量条并选择正确的收音设备。';
    $('read-step').textContent = '跟读未完成，请重试。'; stop();
  };
  session.onend = () => { if (recognizer !== session) return; if (!received) $('recognition-status').textContent = '没有听到单词，请再次点击跟读。'; stop(); };
  // Permission dialogs may stay open: don't spend the child's speaking time before capture begins.
  recordingTimer = setTimeout(() => { if (recognizer !== session) return; $('recognition-status').textContent = '麦克风尚未就绪，请检查权限或点击跟读重试。'; stop(); session.abort(); }, 60000);
  try {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      micStream = await navigator.mediaDevices.getUserMedia(microphoneConstraints());
      if (recognizer !== session) { micStream.getTracks().forEach(track => track.stop()); return; }
      cleanupMeter = monitorMicrophone(micStream);
      listMicrophones().catch(() => {});
      // Modern browsers can recognize the exact captured track; older ones may use the system default.
      session.start(micStream.getAudioTracks()[0]);
    } else session.start();
  } catch (error) { $('recognition-status').textContent = error.name === 'NotAllowedError' ? '麦克风权限未允许，请检查网站及系统权限。' : '无法打开麦克风或启动识别，请检查收音设备与浏览器支持。'; stop(); }
});
$('answer-form').addEventListener('submit', event => {
  event.preventDefault();
  if (recording || speaking || rewarded) return;
  if (!account.pet) { $('answer-status').textContent = '先在页面上方选一个宠物伙伴，再领取学习奖励。'; return; }
  if (normalizedWord($('spelling').value) !== normalizedWord(levels[levelIndex].word)) {
    $('answer-status').textContent = '差一点点！检查每个字母，再试一次，不扣分。'; $('type-step').textContent = '检查字母，再拼一次。'; return;
  }
  if (!heard || !readCorrect) {
    $('type-step').textContent = '✓ 拼写正确！';
    $('answer-status').textContent = `拼写正确！还需要成功听完朗读并通过跟读，才能领取 ${lessonReward} 星。输入的单词会保留。`;
    return;
  }
  rewarded = true; completing = true; activePointer = null; previous = null; account.points += lessonReward;
  $('type-step').textContent = '✓ 拼写正确！'; $('answer-status').textContent = `跟读和拼写都正确！ · Correct! · ถูกต้อง! +${lessonReward} ⭐`;
  renderPet(); saveAccount(); syncPractice();
  celebrate(levels[levelIndex]); $('praise-message').textContent = `跟读 + 拼写成功！ · Correct! · ถูกต้อง! +${lessonReward} ⭐`;
  setTimeout(() => { $('celebration').hidden = true; $('confetti').replaceChildren(); $('next-level').hidden = false; $('next-level').focus(); }, 2800);
});
$('next-level').addEventListener('click', () => {
  if (!rewarded || speaking || recording) return;
  levelIndex = (levelIndex + 1) % levels.length; account.level = levelIndex; saveAccount();
  heard = false; readCorrect = false; rewarded = false; completing = false;
  $('practice').hidden = false; $('next-level').hidden = true; $('spelling').value = '';
  $('answer-status').textContent = ''; $('listen-step').textContent = '点击“朗读”或“再听一次”，听完后跟读';
  $('recognition-status').textContent = fileMode ? '请打开 http://127.0.0.1:8765 使用跟读，拼写可直接输入。' : '先听朗读，再跟读；也可以先输入单词。'; $('read-step').textContent = '点击麦克风，说出这个英文单词'; $('type-step').textContent = '用键盘拼出单词';
  renderLevel(); renderPet(); syncPractice(); $('speak').focus();
});
renderLevel();
renderPet();
syncPractice();

$('practice').hidden = false;
if (fileMode) $('recognition-status').textContent = '当前从文件打开。请点击下方本地网址使用跟读；拼写可直接输入。';
