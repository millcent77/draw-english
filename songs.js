'use strict';

// Traditional public-domain lyrics. Chinese translations and timing cues created for this app.
const englishSongs = [
  {
    id: 'twinkle', title: 'Twinkle, Twinkle, Little Star', chinese: '小星星', icon: '🌟',
    description: '演唱版 · 找一找 star（星星）、sky（天空）和 diamond（钻石）。',
    author: 'CommandSpry', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Twinkle_twinkle_little_star_(vocal).ogg',
    lines: [
      [0, 'Twinkle, twinkle, little star,', '一闪一闪，小星星，'],
      [4, 'How I wonder what you are!', '我多想知道你是什么！'],
      [8, 'Up above the world so high,', '高高挂在世界上方，'],
      [12, 'Like a diamond in the sky.', '好像天空中的钻石。'],
      [16, 'Twinkle, twinkle, little star,', '一闪一闪，小星星，'],
      [20, 'How I wonder what you are!', '我多想知道你是什么！']
    ]
  },
  {
    id: 'mary', title: 'Mary Had a Little Lamb', chinese: '玛丽有只小羊羔', icon: '🐑',
    description: '清唱版 · 学一学 lamb（小羊）、white（白色）和 snow（雪）。',
    author: 'Celestianpower', license: 'Public domain', licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Mary_Had_a_Little_Lamb.ogg',
    lines: [
      [0, 'Mary had a little lamb,', '玛丽有只小羊羔，'],
      [2.8, 'Little lamb, little lamb,', '小羊羔，小羊羔，'],
      [5.6, 'Mary had a little lamb,', '玛丽有只小羊羔，'],
      [8.4, 'Its fleece was white as snow.', '羊毛洁白像雪花。'],
      [11.2, 'And everywhere that Mary went,', '无论玛丽去哪里，'],
      [14, 'Mary went, Mary went,', '去哪里，去哪里，'],
      [16.8, 'And everywhere that Mary went,', '无论玛丽去哪里，'],
      [19.6, 'The lamb was sure to go.', '小羊总会跟着她。']
    ]
  },
  {
    id: 'row', title: 'Row, Row, Row Your Boat', chinese: '划船歌', icon: '⛵',
    description: '旋律跟唱版 · 跟着旋律看词唱，学习 boat（小船）、stream（小溪）和 dream（梦）。',
    author: 'CambridgeBayWeather', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Row,_Row,_Row_Your_Boat.ogg',
    lines: [
      [0, 'Row, row, row your boat,', '划呀划，划着你的小船，'],
      [2, 'Gently down the stream.', '轻轻顺着小溪向前。'],
      [4, 'Merrily, merrily, merrily, merrily,', '快乐呀，快乐呀，快乐呀，快乐呀，'],
      [6, 'Life is but a dream.', '生活仿佛一场美梦。']
    ]
  }
];

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
    });
  }
  function pauseSong() { playRequest++; audio.pause(); element('song-play').textContent = '▶ 播放歌曲'; }
  async function playSong() {
    if (busy()) { status('请先结束朗读、跟读或麦克风测试，再播放歌曲。'); return; }
    const request = ++playRequest;
    try {
      await audio.play();
      if (request === playRequest) element('song-play').textContent = '⏸ 暂停歌曲';
    } catch (error) {
      if (request === playRequest && error.name !== 'AbortError') status('暂时无法播放，请重试；若刚更新过，请重新启动学习服务。');
    }
  }
  function selectSong(song) {
    pauseSong(); current = song; activeLine = -1;
    audio.src = `assets/songs/${song.id}.ogg`;
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
    const source = document.createElement('a'); source.href = song.source; source.target = '_blank'; source.rel = 'noopener noreferrer'; source.textContent = `${song.author} · 原始录音`;
    const license = document.createElement('a'); license.href = song.licenseUrl; license.target = '_blank'; license.rel = 'noopener noreferrer'; license.textContent = song.license;
    credit.appendChild(source); credit.appendChild(document.createTextNode(' · ')); credit.appendChild(license);
    credit.appendChild(document.createTextNode('。音频未修改，中译和学习时间点由本项目编写。'));
    status('选好啦，点击播放，一起学唱吧。');
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
  audio.addEventListener('play', () => { if (busy()) { pauseSong(); status('请先结束朗读或麦克风活动。'); return; } element('song-play').textContent = '⏸ 暂停歌曲'; status('正在播放，可以跟着高亮歌词一起唱。'); });
  audio.addEventListener('pause', () => { element('song-play').textContent = '▶ 播放歌曲'; });
  audio.addEventListener('timeupdate', highlight);
  audio.addEventListener('seeked', highlight);
  audio.addEventListener('ended', () => { element('song-play').textContent = '▶ 再听一遍'; status('唱完啦！再唱一次，或选一首新歌吧。'); });
  audio.addEventListener('error', () => status('歌曲加载失败。若刚更新过，请关闭旧学习服务后重新双击“启动学习.cmd”。'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseSong(); });
  // Prevent music being picked up as the child's voice even when triggered through other controls.
  ['speak', 'repeat', 'record', 'test-mic', 'drawing-listen'].forEach(id => element(id)?.addEventListener('click', pauseSong));
  selectSong(current);
})();
