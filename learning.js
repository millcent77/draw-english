'use strict';
let courses = englishBanks['6-7'];
let mathCourses = mathBanks['6-7'];
let learning = { age: '6-7', subject: 'english', difficulty: 'easy', positions: { '6-7:english:easy': account.level } };
try {
  const saved = JSON.parse(localStorage.getItem('draw-say-courses-v1'));
  if (saved && ['english', 'math'].includes(saved.subject) && Object.hasOwn(courses, saved.difficulty)) {
    learning.age = Object.hasOwn(englishBanks, saved.age) ? saved.age : '6-7';
    learning.subject = saved.subject; learning.difficulty = saved.difficulty;
    for (const age of Object.keys(englishBanks)) for (const subject of ['english', 'math']) for (const difficulty of Object.keys(courses)) {
      const key = `${age}:${subject}:${difficulty}`;
      const n = saved.positions?.[key] ?? (age === '6-7' ? saved.positions?.[`${subject}:${difficulty}`] : undefined);
      if (Number.isInteger(n) && n >= 0 && n < (subject === 'english' ? englishBanks : mathBanks)[age][difficulty].length) learning.positions[key] = n;
    }
  }
} catch { /* Keep existing pet progress even if new course storage is unavailable. */ }
let mathRewarded = false;
const courseKey = () => `${learning.age}:${learning.subject}:${learning.difficulty}`;
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
  courses = englishBanks[learning.age]; mathCourses = mathBanks[learning.age];
  const difficultySelect = $('difficulty'); difficultySelect.replaceChildren();
  const labels = learning.subject === 'math' ? ['基础 · Foundation · พื้นฐาน','进阶 · Intermediate · ขั้นกลาง','挑战 · Challenge · ท้าทาย'] : ['入门 · Easy · ง่าย','进阶 · Medium · ปานกลาง','挑战 · Hard · ยาก'];
  ['easy','medium','hard'].forEach((id,index) => {const option=document.createElement('option');option.value=id;option.textContent=labels[index];difficultySelect.appendChild(option);});
  lessonReward = difficultyRewards[learning.difficulty];
  $('check-answer').textContent = `检查答案 · Check · ตรวจ +${lessonReward} ⭐`;
  $('math-check').textContent = `检查 · Check · ตรวจ +${lessonReward} ⭐`;
  $('age-group').value = learning.age; $('subject').value = learning.subject; $('difficulty').value = learning.difficulty;
  const math = learning.subject === 'math';
  document.querySelector('.lesson').hidden = math; $('practice').hidden = math; $('math-practice').hidden = !math; $('done').hidden = math; $('color-hint').hidden = math;
  $('learning-description').textContent = ageDescriptions[learning.age][learning.subject];
  if (math) renderMath();
  else {
    levels.splice(0, levels.length, ...courses[learning.difficulty]); levelIndex = learning.positions[courseKey()] || 0;
    resetEnglishPractice(); renderLevel(); $('guide').style.opacity = learning.difficulty === 'hard' ? '0' : learning.difficulty === 'medium' ? '.12' : '.23';
    renderEnglishTask();
  }
  renderDrawingMode();
}
function changeCourse() {
  if (speaking || recording || testingMic || !$('celebration').hidden) {
    $('age-group').value = learning.age; $('subject').value = learning.subject; $('difficulty').value = learning.difficulty;
    $('learning-status').textContent = '请先结束朗读或麦克风活动。 · Finish audio first. · หยุดเสียงก่อน'; return;
  }
  if (learning.subject === 'english') learning.positions[courseKey()] = levelIndex;
  learning.age = $('age-group').value; learning.subject = $('subject').value; learning.difficulty = $('difficulty').value;
  $('learning-status').textContent = ''; renderCourse(); saveLearning();
}
$('age-group').addEventListener('change', changeCourse); $('subject').addEventListener('change', changeCourse); $('difficulty').addEventListener('change', changeCourse);
$('next-level').addEventListener('click', () => { learning.positions[courseKey()] = levelIndex; saveLearning(); renderEnglishTask(); });
$('math-form').addEventListener('submit', event => {
  event.preventDefault(); if (mathRewarded || learning.subject !== 'math' || drawingMode() !== 'standard') return;
  if (!account.pet) { $('math-status').textContent = '先选择宠物 · Choose a pet first · เลือกสัตว์เลี้ยงก่อน'; return; }
  const answer = $('math-answer').value.trim(), question = mathCourses[learning.difficulty][learning.positions[courseKey()] || 0];
  if (!matchesMathAnswer(answer, question.answer)) { $('math-status').textContent = '再算一次，不扣分！ · Try again! · ลองคำนวณอีกครั้ง'; return; }
  mathRewarded = true; account.points += lessonReward; renderPet(); saveAccount();
  $('math-status').textContent = `答对啦！ · Correct! · ถูกต้อง! +${lessonReward} ⭐`; $('math-answer').disabled = true; $('math-check').disabled = true; $('math-next').hidden = false;
});
$('math-next').addEventListener('click', () => {
  if (!mathRewarded || learning.subject !== 'math') return;
  learning.positions[courseKey()] = ((learning.positions[courseKey()] || 0) + 1) % mathCourses[learning.difficulty].length;
  saveLearning(); renderMath(); $('math-answer').focus();
});
renderCourse();

function renderEnglishTask() {
  const item = levels[levelIndex];
  $('lesson-prompt').textContent = item.task;
  $('english-reading').hidden = !item.reading;
  $('english-reading').textContent = item.reading || '';
  // Hide the model while reading/grammar questions are being answered.
  if (item.reading || learning.age === '10') {
    $('lesson-word').textContent = 'Read & answer'; $('lesson-translation').textContent = '';
  }
}
function matchesMathAnswer(text, expected) {
  const value = text.trim();
  let number;
  if (/^\d+\s*\/\s*\d+$/.test(value)) {
    const [a,b] = value.split('/').map(Number); if (b === 0) return false; number = a/b;
  } else if (/^\d+(?:\.\d+)?$/.test(value)) number = Number(value);
  else return false;
  return Number.isFinite(number) && Math.abs(number - expected) < 1e-8;
}
