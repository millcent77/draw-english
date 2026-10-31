'use strict';
const petStages = [
  { min:1,name:'出生期 · Newborn · แรกเกิด',size:'.7' },
  { min:2,name:'幼年期 · Baby · วัยเด็ก',size:'.76' },
  { min:4,name:'探索期 · Explorer · นักสำรวจ',size:'.82' },
  { min:7,name:'青年期 · Young · วัยรุ่น',size:'.88' },
  { min:10,name:'成熟期 · Mature · โตเต็มวัย',size:'.94' },
  { min:15,name:'达人期 · Expert · ผู้ชำนาญ',size:'1' },
  { min:20,name:'守护期 · Guardian · ผู้พิทักษ์',size:'1.04' },
  { min:30,name:'传奇期 · Legend · ตำนาน',size:'1.08' }
];
const petMoves = [
  { id: 'blink', level: 1, name: '点头 · Nod · พยักหน้า' },
  { id: 'wave', level: 2, name: '摇摆 · Sway · โยกตัว' },
  { id: 'jump', level: 4, name: '跳跃 · Jump · กระโดด' },
  { id: 'dance', level: 7, name: '跳舞 · Dance · เต้น' },
  { id:'stretch',level:10,name:'伸懒腰 · Stretch · ยืดตัว' },
  { id:'spin',level:15,name:'转圈 · Spin · หมุนตัว' },
  { id:'glow',level:20,name:'星光 · Sparkle · ประกายดาว' },
  { id:'cheer',level:30,name:'欢呼 · Cheer · ดีใจ' }
];
const petMotionRows = { blink:0, wave:1, jump:2, dance:3, stretch:4, spin:5, glow:6, cheer:7, eat:8, cuddle:9 };
const petMotionSequences = {
  blink:[0,1,2,3,0,1,2,3], wave:[0,1,2,3,0,1,2,3],
  jump:[0,0,1,2,2,3,3], dance:[0,1,2,3,0,1,2,3,0,1,2,3],
  stretch:[0,1,1,1,2,2,3], spin:[0,1,2,3,0,1,2,3,0],
  glow:[0,1,2,3,0,1,2,3], cheer:[0,1,2,1,2,1,3],
  eat:[0,1,1,2,0,1,2,3], cuddle:[0,1,1,2,2,3]
};
// Verified row boundaries of the generated atlases; equal-grid cropping can clip ears/tails.
const petPoseBounds = {
  cat:[0,198,382,559,765,964,1151,1349,1551,1737,1983],
  dog:[0,183,356,527,722,912,1100,1282,1485,1688,1930],
  rabbit:[0,195,382,582,792,991,1184,1376,1571,1760,1983],
  panda:[0,192,390,595,790,988,1179,1374,1564,1748,1983]
};
let petMotionArt = null;
let petMotionTimer = null;
let petTouchCount = 0;
function stopPetMotion() {
  clearTimeout(petMotionTimer); petMotionTimer = null;
  const avatar = document.getElementById('pet-avatar');
  avatar.setAttribute('data-motion', ''); avatar.setAttribute('data-animating', 'false');
}
function clearPoseEdgeFragments(context) {
  if (typeof context.getImageData !== 'function') return;
  try {
    const pixels = context.getImageData(0,0,256,256), data = pixels.data;
    const seen = new Uint8Array(256*256);
    for (let start=0; start<seen.length; start++) {
      if (seen[start] || data[start*4+3]<32) continue;
      const component=[start]; seen[start]=1; let central=false;
      for (let cursor=0; cursor<component.length; cursor++) {
        const index=component[cursor], x=index%256;
        if (x>=20 && x<=235) central=true;
        for (const next of [x>0?index-1:-1,x<255?index+1:-1,index-256,index+256]) {
          if (next<0 || next>=seen.length || seen[next] || data[next*4+3]<32) continue;
          seen[next]=1; component.push(next);
        }
      }
      // A neighboring cell may contribute a detached sliver at the very edge.
      // Never remove components of the pet that connect into the central area.
      if (!central) for (const index of component) data[index*4+3]=0;
    }
    context.putImageData(pixels,0,0);
  } catch { /* file:// may restrict canvas pixel reads; full poses still render. */ }
}
function playPetMove(move) {
  const level = Math.floor(account.growth / 30) + 1;
  if (!account.pet || (!['eat', 'cuddle'].includes(move) && !petMoves.some(item => item.id === move && level >= item.level))) return;
  stopPetMotion();
  const avatar = document.getElementById('pet-avatar');
  avatar.setAttribute('data-motion', move);
  const motionStatus = document.getElementById('pet-action-status');
  motionStatus.textContent = move === 'eat' ? '好吃！ · Yummy! · อร่อย!' : move === 'cuddle' ? '喜欢你摸摸我！ · I love your pats! · ชอบให้เธอลูบฉัน!' : petMoves.find(item => item.id === move).name;
  if (avatar.dataset.framesReady !== 'true') {
    motionStatus.textContent = '动作图片正在加载，请稍后再点。 · Loading poses, please retry. · กำลังโหลดท่าทาง โปรดลองอีกครั้ง';
    stopPetMotion(); return;
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sequence = reduced ? [1] : petMotionSequences[move];
  const petId = account.pet;
  let cursor = 0;
  avatar.setAttribute('data-animating', 'true');
  function frame() {
    if (account.pet !== petId) { stopPetMotion(); return; }
    const column = sequence[cursor], row = petMotionRows[move];
    avatar.style.setProperty('--action-x', `${column * 100 / 3}%`);
    avatar.style.setProperty('--action-y', `${row * 100 / 9}%`);
    const { image, canvas: poseCanvas } = petMotionArt;
    const context = poseCanvas.getContext('2d');
    const bounds = petPoseBounds[petId], sourceWidth = image.naturalWidth / 4;
    const sourceHeight = bounds[row + 1] - bounds[row];
    const scale = Math.min(240 / sourceWidth, 240 / sourceHeight);
    const width = sourceWidth * scale, height = sourceHeight * scale;
    context.clearRect(0,0,256,256);
    context.save();
    // The cat atlas supplies the same profile twice; mirror the second profile, never the back.
    if (petId === 'cat' && move === 'spin' && column === 3) { context.translate(256,0); context.scale(-1,1); }
    context.drawImage(image, column * sourceWidth, bounds[row], sourceWidth, sourceHeight, (256-width)/2, 248-height, width, height);
    context.restore();
    clearPoseEdgeFragments(context);
    avatar.style.setProperty('--pose-lift', move === 'jump' && (column === 1 || column === 2) ? '-12px' : '0px');
    cursor++;
    petMotionTimer = setTimeout(cursor < sequence.length ? frame : stopPetMotion, reduced ? 1800 : move === 'dance' ? 160 : 230);
  }
  frame();
}
function renderPetCharacter(pet) {
  const avatar = document.getElementById('pet-avatar');
  avatar.disabled = !pet;
  if (!pet) { avatar.textContent = '🐾'; document.getElementById('pet-actions').replaceChildren(); return; }
  const level = Math.floor(account.growth / 30) + 1;
  const phase = petStages.filter(item => level >= item.min).slice(-1)[0];
  if (avatar.dataset.pet !== pet.id) {
    stopPetMotion(); avatar.dataset.framesReady = 'false';
    avatar.replaceChildren(); avatar.dataset.pet = pet.id;
    const character = document.createElement('div'); character.className = 'pet-character';
    for (const part of ['tail', 'body', 'foot left', 'foot right', 'arm left', 'arm right', 'head', 'badge']) {
      const node = document.createElement('span'); node.className = `pet-part pet-${part}`;
      if (part === 'head') for (const detail of ['ear left', 'ear right', 'eye left', 'eye right', 'cheek left', 'cheek right', 'muzzle', 'nose']) {
        const feature = document.createElement('span'); feature.className = `pet-feature pet-${detail}`; node.appendChild(feature);
      }
      character.appendChild(node);
    }
    // Keep the original artwork intact; moving cropped body sections tears the silhouette.
    const sprite=document.createElement('span');sprite.className='pet-sprite';sprite.setAttribute('aria-hidden','true');character.appendChild(sprite);
    const action = document.createElement('canvas'); action.className = 'pet-action-sprite'; action.width=256; action.height=256; action.setAttribute('aria-hidden','true'); character.appendChild(action);
    const preload = document.createElement('img'); preload.hidden = true; preload.alt = '';
    if (window.location?.protocol !== 'file:') preload.crossOrigin = 'anonymous';
    petMotionArt = { image:preload, canvas:action };
    preload.addEventListener('load', () => { if (avatar.dataset.pet === pet.id) avatar.dataset.framesReady = 'true'; });
    preload.addEventListener('error', () => {
      if (avatar.dataset.pet !== pet.id) return;
      avatar.dataset.framesReady = 'false'; stopPetMotion();
      document.getElementById('pet-action-status').textContent = '动作图片未加载，请刷新。 · Reload to load pet poses. · รีเฟรชเพื่อโหลดท่าทาง';
    });
    preload.src = `assets/pet-${pet.id}-actions.png`; character.appendChild(preload);
    const effect=document.createElement('span');effect.className='pet-motion-effect';effect.setAttribute('aria-hidden','true');character.appendChild(effect);
    const heart = document.createElement('span'); heart.className = 'pet-affection'; heart.textContent = '♥'; character.appendChild(heart);
    avatar.appendChild(character);
  }
  const phaseIndex=petStages.indexOf(phase);
  avatar.style.setProperty('--pet-size', phase.size);
  avatar.style.setProperty('--pet-position',`${phaseIndex%4*100/3}% ${Math.floor(phaseIndex/4)*100}%`);
  avatar.setAttribute('data-stage', String(phase.min));
  document.getElementById('pet-stage').textContent = phase.name;
  const next = petStages.find(item => item.min > level);
  document.getElementById('pet-stage-hint').textContent = next ? `${next.min} 级进入下一阶段 · Next stage at level ${next.min} · ระยะต่อไปที่ระดับ ${next.min}` : '已成熟，继续学习提升等级 · Keep learning! · เรียนรู้ต่อไป';
  const actions = document.getElementById('pet-actions'); actions.replaceChildren();
  petMoves.forEach(move => {
    const button = document.createElement('button'); button.type = 'button'; button.disabled = level < move.level;
    const fullName=`${move.name}${button.disabled ? ` 🔒 Lv.${move.level}` : ''}`;
    const icons={blink:'☺',wave:'↔',jump:'↑',dance:'♫',stretch:'☀',spin:'↻',glow:'✦',cheer:'★'};
    button.textContent=`${icons[move.id]} ${move.name.split(' · ')[0]}${button.disabled ? ` 🔒${move.level}` : ''}`;button.title=fullName;button.setAttribute('aria-label',fullName);
    button.addEventListener('click', () => playPetMove(move.id)); actions.appendChild(button);
  });
}

document.getElementById('pet-avatar').addEventListener('click', () => {
  if (!account.pet) return;
  const level = Math.floor(account.growth / 30) + 1;
  const reactions = ['cuddle', ...petMoves.filter(move => level >= move.level).map(move => move.id)];
  playPetMove(reactions[petTouchCount++ % reactions.length]);
});
