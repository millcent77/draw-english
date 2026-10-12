'use strict';
let drawingState = { modes: { english: 'standard', math: 'standard' }, positions: {} };
const practiceOptions = {
 english: [['standard','常规英语 · Standard · แบบปกติ'],['listening','听指令画画 · Listen & draw · ฟังแล้ววาด']],
 math: [['standard','计算练习 · Calculate · คำนวณ'],['fractions','分数涂色 · Paint fractions · ระบายเศษส่วน'],['geometry','方格面积与周长 · Area & perimeter · พื้นที่และรอบรูป']]
};
try {
 const saved = JSON.parse(localStorage.getItem('draw-say-drawing-v1'));
 if (saved) {
  for (const subject of ['english','math']) if (practiceOptions[subject].some(([id]) => id === saved.modes?.[subject])) drawingState.modes[subject] = saved.modes[subject];
  for (const [key,value] of Object.entries(saved.positions || {})) if (/^(6-7|8-9|10):(easy|medium|hard):(fractions|geometry|listening)$/.test(key) && Number.isInteger(value) && value >= 0 && value < 12) drawingState.positions[key] = value;
 }
} catch { /* Existing pet and course storage remains independent. */ }
let drawingCells = [], drawingQuestion = null, drawingRewarded = false, drawingHeard = false;
function saveDrawing() { try { localStorage.setItem('draw-say-drawing-v1',JSON.stringify(drawingState)); } catch { $('drawing-status').textContent = '无法保存进度 · Progress not saved · บันทึกไม่ได้'; } }
const drawingMode = () => drawingState.modes[learning.subject];
const drawingKey = () => `${learning.age}:${learning.difficulty}:${drawingMode()}`;
function makeDrawingQuestion(mode,index,difficulty) {
 const rank = {easy:0,medium:1,hard:2}[difficulty];
 if (mode === 'fractions') {
  const denominator = [4,6,8,10,12][(index+rank)%5], numerator = 1+(index+rank*2)%(denominator-1);
  return {mode, denominator, numerator, count:denominator, answer:numerator/denominator,
   title:`${numerator}/${denominator}`, prompt:'每格是一等份。涂出这个分数，再填写等值分数或小数。 · Paint the fraction, then enter its value. · ระบายเศษส่วน แล้วตอบเป็นเศษส่วนหรือทศนิยม'};
 }
 if (mode === 'geometry') {
  const width=3+(index+rank)%4,height=2+(index+rank)%3,perimeter=index%2 === 1;
  return {mode,width,height,count:64,answer:perimeter ? 2*(width+height) : width*height,
   title:`${width} × ${height}`,prompt:`画出宽 ${width} 格、高 ${height} 格的实心长方形，计算${perimeter ? '周长' : '面积'}（每格边长1）。 · Paint a solid rectangle ${width} wide and ${height} high; find ${perimeter ? 'perimeter' : 'area'}. · ระบายสี่เหลี่ยมกว้าง ${width} สูง ${height} แล้วหา${perimeter ? 'ความยาวรอบรูป' : 'พื้นที่'}`};
 }
 const color=['red','blue','green'][(index+rank)%3],shape=['circle','square','triangle'][(index+rank)%3],number=2+(index+rank)%5,region=index%2 ? 'above' : 'below';
 return {mode,color,shape,number,region,count:20,title:`Draw ${number} ${color} ${shape}s ${region} the tree.`,
  prompt:'先听英语指令，再选颜色、形状，在树的上方或下方画出来。点击同一个图形可以擦除。 · Listen, choose tools and draw; tap again to erase. · ฟัง เลือกสีและรูปทรง แล้ววาด แตะอีกครั้งเพื่อลบ'};
}
function renderDrawingMode() {
 const select=$('practice-mode'); select.replaceChildren();
 practiceOptions[learning.subject].forEach(([id,name]) => {const option=document.createElement('option');option.value=id;option.textContent=name;select.appendChild(option);});
 select.value=drawingMode();
 const active=drawingMode() !== 'standard';
 $('drawing-task').hidden=!active; $('free-actions').hidden=active; $('free-footer').hidden=active; $('free-toolbar').hidden=active; $('free-canvas').hidden=active;
 $('done').hidden=active || learning.subject === 'math'; $('color-hint').hidden=active || learning.subject === 'math';
 if (active) {
  document.querySelector('.lesson').hidden=true; $('practice').hidden=true; $('math-practice').hidden=true;
  completing=false; activePointer=null; previous=null; renderDrawingQuestion(); renderPet();
 }
}
function renderDrawingQuestion() {
 const index=drawingState.positions[drawingKey()] || 0;
 drawingQuestion=makeDrawingQuestion(drawingMode(),index,learning.difficulty);
 drawingCells=Array(drawingQuestion.count).fill(null); drawingRewarded=false; drawingHeard=false;
 $('drawing-progress').textContent=`第 ${index+1} 题，共 12 题 · Question ${index+1} of 12 · ข้อ ${index+1} จาก 12`;
 $('drawing-title').textContent=drawingQuestion.title; $('drawing-prompt').textContent=drawingQuestion.prompt;
 const listening=drawingQuestion.mode === 'listening';
 $('drawing-listen').hidden=!listening; $('drawing-tools').hidden=!listening;
 $('drawing-answer').hidden=listening; $('drawing-answer-label').hidden=listening;
 $('drawing-answer').value=''; $('drawing-answer').disabled=false; $('drawing-check').disabled=false; $('drawing-clear').disabled=false;
 $('drawing-check').textContent=`检查作品 · Check drawing · ตรวจภาพ +${lessonReward} ⭐`;
 $('drawing-status').textContent=''; $('drawing-next').hidden=true;
 $('drawing-color').value='red'; $('drawing-shape').value='circle'; renderDrawingBoard();
}
function renderDrawingBoard() {
 const board=$('drawing-board'),q=drawingQuestion; board.replaceChildren();
 board.setAttribute('data-kind',q.mode);
 if (q.mode === 'fractions') board.style.setProperty('--fraction-columns',String(q.denominator === 6 ? 3 : q.denominator === 10 ? 5 : 4));
 for (let index=0;index<q.count;index++) {
  if (q.mode === 'listening' && index === 10) {const tree=document.createElement('div');tree.className='drawing-tree';tree.textContent='🌳';tree.setAttribute('aria-label','树 · Tree · ต้นไม้');board.appendChild(tree);}
  const button=document.createElement('button');button.type='button';button.className='drawing-cell';
  button.setAttribute('aria-label',`${index+1} · ${q.mode === 'listening' ? index<10 ? '树上方 · Above · ด้านบน' : '树下方 · Below · ด้านล่าง' : '方格 · Cell · ช่อง'}`);
  paintDrawingCell(button,index); button.disabled=drawingRewarded;
  button.addEventListener('click',() => {
   if (drawingRewarded || speaking) return;
   if (q.mode !== 'listening') drawingCells[index]=drawingCells[index] ? null : {color:'blue',shape:'square'};
   else {
    const color=$('drawing-color').value,shape=$('drawing-shape').value,old=drawingCells[index];
    drawingCells[index]=shape === 'erase' || (old?.color === color && old?.shape === shape) ? null : {color,shape};
   }
   paintDrawingCell(button,index);
  }); board.appendChild(button);
 }
}
function paintDrawingCell(button,index) {
 const cell=drawingCells[index];button.setAttribute('aria-pressed',String(Boolean(cell)));
 button.textContent=cell && drawingQuestion.mode === 'listening' ? {circle:'●',square:'■',triangle:'▲'}[cell.shape] : '';
 button.style.setProperty('--drawing-ink',cell ? {red:'#ed4545',blue:'#3884ea',green:'#35a96e'}[cell.color] : '#3884ea');
}
function validDrawing(question,cells) {
 const selected=cells.map((cell,index)=>cell ? index : -1).filter(index=>index>=0);
 if (question.mode === 'fractions') return selected.length === question.numerator;
 if (question.mode === 'listening') return selected.length === question.number && selected.every(index => cells[index].color === question.color && cells[index].shape === question.shape && (question.region === 'above' ? index<10 : index>=10));
 if (selected.length !== question.width*question.height) return false;
 const xs=selected.map(index=>index%8),ys=selected.map(index=>Math.floor(index/8));
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 return maxX-minX+1 === question.width && maxY-minY+1 === question.height;
}
$('practice-mode').addEventListener('change',() => {
 if (speaking || recording || testingMic || !$('celebration').hidden) {$('practice-mode').value=drawingMode();return;}
 const selected=$('practice-mode').value;
 if (!practiceOptions[learning.subject].some(([id])=>id===selected)) return;
 drawingState.modes[learning.subject]=selected;saveDrawing();renderCourse();
});
$('drawing-listen').addEventListener('click',async () => {
 if (speaking || drawingRewarded || drawingQuestion?.mode !== 'listening') return;
 speaking=true; drawingHeard=false; $('drawing-listen').disabled=true; $('drawing-check').disabled=true;
 const ok=await speakText(drawingQuestion.title);
 speaking=false; drawingHeard=ok; $('drawing-listen').disabled=false; $('drawing-check').disabled=false;
 $('drawing-status').textContent=ok ? '听完啦，按指令画！ · Now draw! · วาดตามคำสั่ง!' : '朗读失败，请重试。 · Audio failed; retry. · ฟังไม่สำเร็จ ลองอีกครั้ง';
});
$('drawing-clear').addEventListener('click',() => {if (drawingRewarded || speaking) return;drawingCells.fill(null);renderDrawingBoard();$('drawing-status').textContent='';});
$('drawing-form').addEventListener('submit',event => {
 event.preventDefault(); if (drawingRewarded || speaking || drawingMode() === 'standard') return;
 if (!account.pet) {$('drawing-status').textContent='先选择宠物 · Choose a pet · เลือกสัตว์เลี้ยง';return;}
 if (drawingQuestion.mode === 'listening' && !drawingHeard) {$('drawing-status').textContent='先听完指令。 · Listen first. · ฟังก่อน';return;}
 if (!validDrawing(drawingQuestion,drawingCells)) {$('drawing-status').textContent='检查数量、形状、颜色和位置，再试一次。 · Check your drawing and retry. · ตรวจภาพแล้วลองอีกครั้ง';return;}
 if (drawingQuestion.mode !== 'listening' && !matchesMathAnswer($('drawing-answer').value,drawingQuestion.answer)) {$('drawing-status').textContent='画对啦，再检查计算答案。 · Drawing is correct; check the number. · ภาพถูกแล้ว ตรวจคำตอบตัวเลข';return;}
 drawingRewarded=true;account.points+=lessonReward;renderPet();saveAccount();renderDrawingBoard();
 $('drawing-status').textContent=`作品正确！ · Correct! · ถูกต้อง! +${lessonReward} ⭐`;
 $('drawing-check').disabled=true;$('drawing-answer').disabled=true;$('drawing-clear').disabled=true;$('drawing-next').hidden=false;
});
$('drawing-next').addEventListener('click',() => {if (!drawingRewarded || speaking) return;drawingState.positions[drawingKey()]=((drawingState.positions[drawingKey()] || 0)+1)%12;saveDrawing();renderDrawingQuestion();});
