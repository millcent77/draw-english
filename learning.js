'use strict';
// Keep the original account and speech flow; new course progress has its own storage.
const originalLessons = levels.map(item => ({ ...item }));
const courses = {
  easy: originalLessons,
  medium: originalLessons.map((item, i) => ({ ...item, word: ['Red apple', 'Small cat', 'Yellow sun', 'Green tree'][i], translation: ['红苹果', '小猫', '黄色太阳', '绿色的树'][i] })),
  hard: originalLessons.map((item, i) => ({ ...item, word: ['I like apples', 'This is my cat', 'The sun is yellow', 'I see a green tree'][i], translation: ['我喜欢苹果', '这是我的猫', '太阳是黄色的', '我看见一棵绿树'][i] }))
};
function arithmeticQuestion(a, b, op) {
  const answer = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
  const prompts = {
    '+': '试着凑十或拆分数字，再计算。 · Make tens or split numbers. · แยกจำนวนหรือทำให้ครบสิบ',
    '−': '可以画数轴，分步往回减。 · Draw a number line and subtract in steps. · วาดเส้นจำนวนแล้วลบทีละขั้น',
    '×': '画出分组，想一想每组的数量。 · Draw equal groups. · วาดกลุ่มที่มีจำนวนเท่ากัน',
    '÷': '把总数平均分组，每组有多少？ · Share equally. How many in each group? · แบ่งเท่า ๆ กัน แต่ละกลุ่มมีเท่าไร'
  };
  return { title: `${a} ${op} ${b} = ?`, prompt: prompts[op], groups: [], answer };
}
const mathCourses = {
  easy: [[7, 5, '+'], [13, 6, '−'], [8, 9, '+'], [16, 8, '−'], [6, 7, '+'], [18, 9, '−'], [9, 5, '+'], [20, 7, '−'], [8, 6, '+'], [17, 9, '−']].map(args => arithmeticQuestion(...args)),
  medium: [[27, 18, '+'], [52, 26, '−'], [38, 24, '+'], [71, 35, '−'], [46, 29, '+'], [90, 47, '−'], [58, 17, '+'], [83, 58, '−']].map(args => arithmeticQuestion(...args)),
  hard: [[6, 7, '×'], [24, 6, '÷'], [8, 9, '×'], [56, 7, '÷'], [12, 4, '×'], [81, 9, '÷'], [9, 6, '×'], [72, 8, '÷']].map(args => arithmeticQuestion(...args))
};
let learning = { subject: 'english', difficulty: 'easy', positions: { 'english:easy': account.level } };
try {
  const saved = JSON.parse(localStorage.getItem('draw-say-courses-v1'));
  if (saved && ['english', 'math'].includes(saved.subject) && courses[saved.difficulty]) {
    learning.subject = saved.subject; learning.difficulty = saved.difficulty;
    for (const subject of ['english', 'math']) for (const difficulty of Object.keys(courses)) {
      const key = `${subject}:${difficulty}`, n = saved.positions?.[key];
      if (Number.isInteger(n) && n >= 0 && n < (subject === 'english' ? courses : mathCourses)[difficulty].length) learning.positions[key] = n;
    }
  }
} catch { /* Keep existing pet progress even if new course storage is unavailable. */ }
let mathRewarded = false;
const courseKey = () => `${learning.subject}:${learning.difficulty}`;
function saveLearning() {
  try { localStorage.setItem('draw-say-courses-v1', JSON.stringify(learning)); }
  catch { $('learning-status').textContent = '进度未保存 · Progress not saved · บันทึกไม่ได้'; }
}
function resetEnglishPractice() {
  heard = false; readCorrect = false; rewarded = false; completing = false;
  $('next-level').hidden = true; $('spelling').value = ''; $('answer-status').textContent = '';
  $('listen-step').textContent = '点击朗读，听完后跟读'; $('read-step').textContent = '读出英文单词、词组或句子'; $('type-step').textContent = '输入完整英文，注意词语之间的空格';
  $('recognition-status').textContent = '先听朗读，再跟读；也可以先输入答案。';
  $('celebration').hidden = true; syncPractice(); renderPet();
}
function renderMath() {
  const list = mathCourses[learning.difficulty], index = learning.positions[courseKey()] || 0, question = list[index];
  mathRewarded = false; completing = false; activePointer = null; previous = null;
  $('math-progress').textContent = `第 ${index + 1} 题，共 ${list.length} 题 · Question ${index + 1} of ${list.length} · ข้อ ${index + 1} จาก ${list.length}`;
  $('math-title').textContent = question.title;
  $('math-prompt').textContent = question.prompt;
  $('math-visual').replaceChildren();
  question.groups.forEach(n => { const group = document.createElement('span'); group.textContent = Array(n).fill('●').join(' '); $('math-visual').appendChild(group); });
  $('math-answer').value = ''; $('math-answer').disabled = false; $('math-check').disabled = false; $('math-status').textContent = ''; $('math-next').hidden = true;
  $('guide').replaceChildren(); ctx.clearRect(0, 0, canvas.width, canvas.height);
  status.textContent = '可以画数轴、拆分数字或分组，帮助计算。 · Draw to solve. · วาดเพื่อช่วยคำนวณ';
}
function renderCourse() {
  $('subject').value = learning.subject; $('difficulty').value = learning.difficulty;
  const math = learning.subject === 'math';
  document.querySelector('.lesson').hidden = math; $('practice').hidden = math; $('math-practice').hidden = !math; $('done').hidden = math; $('color-hint').hidden = math;
  $('learning-description').textContent = (math ? { easy: '20 以内加减法 · Addition & subtraction to 20 · บวกและลบไม่เกิน 20', medium: '100 以内加减法 · Addition & subtraction to 100 · บวกและลบไม่เกิน 100', hard: '乘除法 · Multiplication & division · คูณและหาร' } : { easy: '单词与描画 · Words & tracing · คำศัพท์และวาดตาม', medium: '颜色、大小词组 · Descriptive phrases · วลีบรรยาย', hard: '完整句子，自由画 · Sentences & free drawing · ประโยคและวาดอิสระ' })[learning.difficulty];
  if (math) renderMath();
  else {
    levels.splice(0, levels.length, ...courses[learning.difficulty]); levelIndex = learning.positions[courseKey()] || 0;
    resetEnglishPractice(); renderLevel(); $('guide').style.opacity = learning.difficulty === 'hard' ? '0' : learning.difficulty === 'medium' ? '.12' : '.23';
    $('lesson-prompt').textContent = learning.difficulty === 'easy' ? `画一个属于你的${levels[levelIndex].translation}吧！` : `画出这句英语的意思：${levels[levelIndex].translation}`;
  }
}
function changeCourse() {
  if (speaking || recording || testingMic || (completing && !rewarded) || !$('celebration').hidden) {
    $('subject').value = learning.subject; $('difficulty').value = learning.difficulty;
    $('learning-status').textContent = '请先结束朗读或麦克风活动。 · Finish audio first. · หยุดเสียงก่อน'; return;
  }
  if (learning.subject === 'english') learning.positions[courseKey()] = levelIndex;
  learning.subject = $('subject').value; learning.difficulty = $('difficulty').value;
  $('learning-status').textContent = ''; renderCourse(); saveLearning();
}
$('subject').addEventListener('change', changeCourse); $('difficulty').addEventListener('change', changeCourse);
$('next-level').addEventListener('click', () => { learning.positions[courseKey()] = levelIndex; saveLearning(); if (learning.difficulty !== 'easy') $('lesson-prompt').textContent = `画出这句英语的意思：${levels[levelIndex].translation}`; });
$('math-form').addEventListener('submit', event => {
  event.preventDefault(); if (mathRewarded || learning.subject !== 'math') return;
  if (!account.pet) { $('math-status').textContent = '先选择宠物 · Choose a pet first · เลือกสัตว์เลี้ยงก่อน'; return; }
  const answer = $('math-answer').value.trim(), question = mathCourses[learning.difficulty][learning.positions[courseKey()] || 0];
  if (!/^\d+$/.test(answer) || Number(answer) !== question.answer) { $('math-status').textContent = '再算一次，不扣分！ · Try again! · ลองคำนวณอีกครั้ง'; return; }
  mathRewarded = true; account.points += 10; renderPet(); saveAccount();
  $('math-status').textContent = '答对啦！ · Correct! · ถูกต้อง! +10 ⭐'; $('math-answer').disabled = true; $('math-check').disabled = true; $('math-next').hidden = false;
});
$('math-next').addEventListener('click', () => {
  if (!mathRewarded || learning.subject !== 'math') return;
  learning.positions[courseKey()] = ((learning.positions[courseKey()] || 0) + 1) % mathCourses[learning.difficulty].length;
  saveLearning(); renderMath(); $('math-answer').focus();
});
renderCourse();
