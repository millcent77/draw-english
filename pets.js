'use strict';
const petStages = [
  { min: 1, name: '出生期 · Newborn · แรกเกิด', size: '.65' },
  { min: 2, name: '幼年期 · Young · วัยเด็ก', size: '.8' },
  { min: 4, name: '成长期 · Growing · กำลังโต', size: '.94' },
  { min: 7, name: '成熟期 · Mature · โตเต็มวัย', size: '1.08' }
];
const petMoves = [
  { id: 'blink', level: 1, name: '眨眼 · Blink · กะพริบตา' },
  { id: 'wave', level: 2, name: '招手 · Wave · โบกมือ' },
  { id: 'jump', level: 4, name: '跳跃 · Jump · กระโดด' },
  { id: 'dance', level: 7, name: '跳舞 · Dance · เต้น' }
];
let petMotionTimer = null;
function playPetMove(move) {
  const level = Math.floor(account.growth / 30) + 1;
  if (!account.pet || (move !== 'eat' && !petMoves.some(item => item.id === move && level >= item.level))) return;
  clearTimeout(petMotionTimer);
  const avatar = document.getElementById('pet-avatar');
  avatar.setAttribute('data-motion', ''); void avatar.offsetWidth;
  avatar.setAttribute('data-motion', move);
  document.getElementById('pet-action-status').textContent = move === 'eat' ? '好吃！ · Yummy! · อร่อย!' : petMoves.find(item => item.id === move).name;
  petMotionTimer = setTimeout(() => avatar.setAttribute('data-motion', ''), 1800);
}
function renderPetCharacter(pet) {
  const avatar = document.getElementById('pet-avatar');
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
    avatar.appendChild(character);
  }
  avatar.style.setProperty('--pet-size', phase.size);
  avatar.setAttribute('data-stage', String(phase.min));
  document.getElementById('pet-stage').textContent = phase.name;
  const next = petStages.find(item => item.min > level);
  document.getElementById('pet-stage-hint').textContent = next ? `${next.min} 级进入下一阶段 · Next stage at level ${next.min} · ระยะต่อไปที่ระดับ ${next.min}` : '已成熟，继续学习提升等级 · Keep learning! · เรียนรู้ต่อไป';
  const actions = document.getElementById('pet-actions'); actions.replaceChildren();
  petMoves.forEach(move => {
    const button = document.createElement('button'); button.type = 'button'; button.disabled = level < move.level;
    button.textContent = `${move.name}${button.disabled ? ` 🔒 Lv.${move.level}` : ''}`;
    button.addEventListener('click', () => playPetMove(move.id)); actions.appendChild(button);
  });
}
