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
  for (const [key,value] of Object.entries(saved.positions || {})) if (/^(s[1-6]|6-7|8-9|10):(easy|medium|hard):(fractions|geometry|listening)$/.test(key) && Number.isInteger(value) && value >= 0 && value < 12) drawingState.positions[key] = value;
 }
} catch { /* Existing pet and course storage remains independent. */ }
let drawingCells = [], drawingQuestion = null, drawingRewarded = false, drawingHeard = false;
function saveDrawing() { try { localStorage.setItem('draw-say-drawing-v1',JSON.stringify(drawingState)); } catch { $('drawing-status').textContent = '无法保存进度 · Progress not saved · บันทึกไม่ได้'; } }
for (const [key,value] of Object.entries({...drawingState.positions})) {
 const [age,difficulty,mode]=key.split(':');
 if (recommendedStages[age]) drawingState.positions[`s${recommendedStages[age]}:${difficulty}:${mode}`] ??= value;
}
const drawingMode = () => drawingState.modes[learning.subject];
const drawingKey = () => `s${learning.stage}:${learning.difficulty}:${drawingMode()}`;
function makeDrawingQuestion(mode,index,difficulty,stage='2') {
 const rank={easy:0,medium:1,hard:2}[difficulty],level=Number(stage);
 if (mode==='fractions') {
  const partitions={1:[2],2:[4],3:[3,5,10],4:[6,8,12],5:[10],6:[5,8,10]};
  const choices=partitions[level],denominator=choices[(index+rank)%choices.length],numerator=1+(index+rank*2)%(denominator-1);
  const total=denominator*(3+index%4),answer=level===1 ? numerator : level===5 ? numerator/denominator*100 : level===6 ? total*numerator/denominator : numerator/denominator;
  const title=level===5 ? `${numerator}/${denominator} → ?%` : level===6 ? `${numerator}/${denominator} of ${total}` : `${numerator}/${denominator}`;
  const prompt=level===1 ? '涂出一半，填涂色格数。 · Paint half; enter the painted cell count. · ระบายครึ่งหนึ่งแล้วตอบจำนวนช่อง' : level===5 ? '涂出分数，再填写百分数数字（不填%）。 · Paint then enter the percentage number. · ระบายแล้วตอบตัวเลขเปอร์เซ็นต์' : level===6 ? `先画出分数模型，再求 ${total} 的这个分数。 · Paint the model, then find this fraction of ${total}. · ระบายแบบจำลองแล้วหาเศษส่วนของ ${total}` : '每格是一等份。涂出分数，再填写等值分数或小数。 · Paint and enter the fraction. · ระบายแล้วตอบเศษส่วน';
  return {mode,denominator,numerator,count:denominator,answer,title,prompt};
 }
 if (mode==='geometry') {
  const width=level===1 ? 2+(index+rank)%3 : Math.min(7,level+1+(index+rank)%2),height=level<=2 ? 1+(index+rank)%2 : 2+(index+rank)%3;
  const perimeter=level>=3 && index%2===1,unit=level===5 ? .5 : level===6 ? 1.5 : 1;
  const answer=level<=2 ? width*height : perimeter ? 2*(width+height)*unit : width*height*unit*unit;
  return {mode,width,height,count:64,answer,title:`${width} × ${height} · Unit ${unit}`,
   prompt:`画宽 ${width} 格、高 ${height} 格的实心长方形。${level<=2 ? '求总格数' : perimeter ? '求周长' : '求面积'}，每格边长 ${unit}。 · Draw ${width} wide and ${height} high; find ${level<=2 ? 'cell count' : perimeter ? 'perimeter' : 'area'}, cell side ${unit}. · วาดกว้าง ${width} สูง ${height} หา${level<=2 ? 'จำนวนช่อง' : perimeter ? 'รอบรูป' : 'พื้นที่'} แต่ละช่องยาว ${unit}`};
 }
 const color=['red','blue','green'][(index+rank)%3],shape=['circle','square','triangle'][(index+rank)%3],number=2+(index+rank)%5;
 const regions=level>=3 ? ['above','below','left','right'] : ['below','above'],region=regions[(index+rank)%regions.length];
 const prefix=level>=5 ? 'After choosing the correct colour and shape, draw' : level>=3 ? 'Listen carefully and draw' : 'Draw';
 return {mode,color,shape,number,region,count:20,title:`${prefix} ${number} ${color} ${shape}s ${region} ${level>=5 ? 'the middle tree without adding other shapes' : 'the tree'}.`,
  prompt:'听完英语指令，按数量、颜色、形状和方位绘图。 · Listen and draw by number, colour, shape and position. · ฟังแล้ววาดตามจำนวน สี รูปทรงและตำแหน่ง'};
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
 drawingQuestion=makeDrawingQuestion(drawingMode(),index,learning.difficulty,learning.stage);
 drawingCells=Array(drawingQuestion.count).fill(null); drawingRewarded=false; drawingHeard=false;
 $('drawing-progress').textContent=`Stage ${learning.stage} · 第 ${index+1} 题，共 12 题 · Question ${index+1} of 12 · ข้อ ${index+1} จาก 12`;
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
 if (q.mode === 'fractions') board.style.setProperty('--fraction-columns',String([2,3,5].includes(q.denominator) ? q.denominator : q.denominator === 6 ? 3 : q.denominator === 10 ? 5 : 4));
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
 if (question.mode === 'listening') return selected.length === question.number && selected.every(index => cells[index].color === question.color && cells[index].shape === question.shape && (inDrawingRegion(index,question.region)));
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

function inDrawingRegion(index,region) {
 if (region==='above') return index<10;
 if (region==='below') return index>=10;
 if (region==='left') return index%5<2;
 return index%5>2;
}
