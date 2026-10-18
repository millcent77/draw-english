'use strict';
// LOCAL_SINGING_PLAYER_V3: complete recorded songs, never speech synthesis.
(() => {
  const element = id => document.getElementById(id);
  const audio = element('song-audio');
  let current = englishSongs[0], activeLine = -1, playRequest = 0;
  const study = document.querySelector('.study-panels');
  const status = message => { element('song-status').textContent = message; };
  function busy() { return typeof speaking !== 'undefined' && (speaking || recording || testingMic); }
  function highlight() {
    let index = -1;
    current.lines.forEach((line, i) => { if (line[0] <= audio.currentTime) index = i; });
    if (index === activeLine) return;
    activeLine = index;
    [...element('song-lyrics').children].forEach((row, i) => {
      row.classList.toggle('is-current', i === index);
      if (i === index) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
      if (i === index && !audio.paused && !element('songs-panel').hidden) row.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    });
  }
  function pauseSong() { playRequest++; audio.pause(); element('song-play').textContent = '▶ 播放演唱'; }
  async function playSong() {
    if (busy()) { status('请先结束朗读、跟读或麦克风测试，再播放歌曲。'); return; }
    const request = ++playRequest;
    try {
      await audio.play();
      if (request === playRequest) element('song-play').textContent = '⏸ 暂停演唱';
    } catch (error) {
      if (request === playRequest && error.name !== 'AbortError') status('暂时无法播放，请重试；若刚更新过，请重新启动学习服务。');
    }
  }
  function selectSong(song) {
    pauseSong(); current = song; activeLine = -1;
    audio.src = `assets/songs/${song.id}.mp3?v=singing-v3`;
    audio.load(); audio.playbackRate = Number(element('song-speed').value) || 1;
    element('song-title').textContent = song.title;
    element('song-description').textContent = song.description;
    [...element('song-list').children].forEach(button => button.setAttribute('aria-pressed', String(button.dataset.song === song.id)));
    element('song-lyrics').replaceChildren();
    song.lines.forEach(([start, english, chinese], i) => {
      const row = document.createElement('button'); row.type = 'button'; row.className = 'lyric-line';
      row.setAttribute('aria-label', `从第 ${i + 1} 句附近听起：${english}`);
      const en = document.createElement('span'); en.lang = 'en-US'; en.textContent = english;
      const zh = document.createElement('span'); zh.className = 'lyric-translation'; zh.lang = 'zh-CN'; zh.textContent = chinese;
      row.appendChild(en); row.appendChild(zh);
      row.addEventListener('click', () => { if (busy()) { status('请先结束朗读或麦克风活动。'); return; } audio.currentTime = start; highlight(); playSong(); });
      element('song-lyrics').appendChild(row);
    });
    const credit = element('song-credit'); credit.replaceChildren();
    const source = document.createElement('a'); source.href = song.source; source.target = '_blank'; source.rel = 'noopener noreferrer'; source.textContent = `${song.author} · 歌曲来源`;
    element('song-original').href = song.audioSource; element('song-original').textContent = '试听官方原始演唱 MP3 ↗';
    credit.appendChild(source); credit.appendChild(document.createTextNode('。Sing Out Loud 儿童歌曲教学录音，完整文件未修改；中文翻译和近似时间提示由本项目编写。'));
    status('选好啦，点击播放，听完整的人声演唱与音乐伴奏。');
  }
  function showSongs(show) {
    if (busy()) { document.getElementById('speech-status').textContent = '请先结束朗读、跟读或麦克风测试，再切换活动。'; return; }
    element('songs-panel').hidden = !show; study.hidden = show;
    element('show-study').setAttribute('aria-pressed', String(!show));
    element('show-songs').setAttribute('aria-pressed', String(show));
    document.querySelector('.study-area').dataset.activity = show ? 'songs' : 'study';
    if (!show) pauseSong();
  }
  englishSongs.forEach(song => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.song = song.id;
    const icon = document.createElement('span'); icon.textContent = song.icon; icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.textContent = song.chinese;
    const title = document.createElement('small'); title.lang = 'en'; title.textContent = song.title;
    button.appendChild(icon); button.appendChild(label); button.appendChild(title);
    button.addEventListener('click', () => selectSong(song)); element('song-list').appendChild(button);
  });
  element('show-songs').addEventListener('click', () => showSongs(true));
  element('show-study').addEventListener('click', () => showSongs(false));
  element('song-play').addEventListener('click', () => audio.paused ? playSong() : pauseSong());
  element('song-restart').addEventListener('click', () => { audio.currentTime = 0; highlight(); playSong(); });
  element('song-speed').addEventListener('change', () => { audio.playbackRate = Number(element('song-speed').value) || 1; });
  element('song-loop').addEventListener('change', () => { audio.loop = element('song-loop').checked; });
  element('song-translation').addEventListener('change', () => element('song-lyrics').classList.toggle('hide-translation', !element('song-translation').checked));
  audio.addEventListener('play', () => { if (busy()) { pauseSong(); status('请先结束朗读或麦克风活动。'); return; } element('song-play').textContent = '⏸ 暂停演唱'; status('正在播放，可以跟着高亮歌词一起唱。'); });
  audio.addEventListener('pause', () => { element('song-play').textContent = '▶ 播放演唱'; if (!audio.ended) status('已暂停，点击播放继续听。'); });
  audio.addEventListener('timeupdate', highlight);
  audio.addEventListener('seeked', highlight);
  audio.addEventListener('ended', () => { element('song-play').textContent = '▶ 再听一遍'; status('唱完啦！再唱一次，或选一首新歌吧。'); });
  audio.addEventListener('error', () => status('歌曲加载失败。若刚更新过，请关闭旧学习服务后重新双击“启动学习.cmd”。'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseSong(); });
  // Prevent music being picked up as the child's voice even when triggered through other controls.
  ['speak', 'repeat', 'record', 'test-mic', 'drawing-listen'].forEach(id => element(id)?.addEventListener('click', pauseSong));
  selectSong(current);
})();
