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
let petMotionTimer = null;
let petTouchCount = 0;
function playPetMove(move) {
  const level = Math.floor(account.growth / 30) + 1;
  if (!account.pet || (!['eat', 'cuddle'].includes(move) && !petMoves.some(item => item.id === move && level >= item.level))) return;
  clearTimeout(petMotionTimer);
  const avatar = document.getElementById('pet-avatar');
  avatar.setAttribute('data-motion', ''); void avatar.offsetWidth;
  avatar.setAttribute('data-motion', move);
  document.getElementById('pet-action-status').textContent = move === 'eat' ? '好吃！ · Yummy! · อร่อย!' : move === 'cuddle' ? '喜欢你摸摸我！ · I love your pats! · ชอบให้เธอลูบฉัน!' : petMoves.find(item => item.id === move).name;
  petMotionTimer = setTimeout(() => avatar.setAttribute('data-motion', ''), 1800);
}
function renderPetCharacter(pet) {
  const avatar = document.getElementById('pet-avatar');
  avatar.disabled = !pet;
  if (!pet) { avatar.textContent = '🐾'; document.getElementById('pet-actions').replaceChildren(); return; }
  const level = Math.floor(account.growth / 30) + 1;
  const phase = petStages.filter(item => level >= item.min).slice(-1)[0];
  if (avatar.dataset.pet !== pet.id) {
    avatar.replaceChildren(); avatar.dataset.pet = pet.id;
    const character = document.createElement('div'); character.className = 'pet-character';
    for (const part of ['tail', 'body', 'foot left', 'foot right', 'arm left', 'arm right', 'head', 'badge']) {
      const node = document.createElement('span'); node.className = `pet-part pet-${part}`;
      if (part === 'head') for (const detail of ['ear left', 'ear right', 'eye left', 'eye right', 'cheek left', 'cheek right', 'muzzle', 'nose']) {
        const feature = document.createElement('span'); feature.className = `pet-feature pet-${detail}`; node.appendChild(feature);
      }
      character.appendChild(node);
    }
    const sprite=document.createElement('span');sprite.className='pet-sprite';sprite.setAttribute('aria-hidden','true');character.appendChild(sprite);
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
