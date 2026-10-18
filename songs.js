'use strict';
// Traditional lyrics with Chinese translations; complete Sing Out Loud teaching recordings.
const twinkleVerse = [
  ['Twinkle, twinkle, little star.', '一闪一闪，小星星。'],
  ['How I wonder what you are.', '我多想知道你是什么。'],
  ['Up above the world so high.', '高高挂在世界上方。'],
  ['Like a diamond in the sky.', '好像天空中的钻石。'],
  ['Twinkle, twinkle, little star.', '一闪一闪，小星星。'],
  ['How I wonder what you are.', '我多想知道你是什么。']
];
const maryVerses = [
  [['Mary had a little lamb,', '玛丽有只小羊羔，'], ['Little lamb, little lamb.', '小羊羔，小羊羔。'], ['Mary had a little lamb,', '玛丽有只小羊羔，'], ['Whose fleece was white as snow.', '羊毛洁白像雪花。']],
  [['And everywhere that Mary went,', '无论玛丽去哪里，'], ['Mary went, Mary went,', '去哪里，去哪里，'], ['And everywhere that Mary went,', '无论玛丽去哪里，'], ['The lamb was sure to go.', '小羊总会跟着她。']],
  [['It followed her to school one day,', '有一天它跟她去了学校，'], ['School one day, school one day.', '去了学校，去了学校。'], ['It followed her to school one day,', '有一天它跟她去了学校，'], ['Which was against the rules.', '可这违反了学校的规定。']],
  [['It made the children laugh and play,', '孩子们开心地笑着玩耍，'], ['Laugh and play, laugh and play.', '笑着玩耍，笑着玩耍。'], ['It made the children laugh and play', '孩子们开心地笑着玩耍，'], ['To see a lamb at school.', '因为看到了校园里的小羊。']],
  [['Mary had a little lamb,', '玛丽有只小羊羔，'], ['Little lamb, little lamb.', '小羊羔，小羊羔。'], ['Mary had a little lamb,', '玛丽有只小羊羔，'], ['Little lamb, little lamb.', '小羊羔，小羊羔。']],
  [['So the teacher turned it out,', '于是老师请它离开，'], ['Turned it out, turned it out.', '请它离开，请它离开。'], ['So the teacher turned it out,', '于是老师请它离开，'], ['But still it lingered near.', '可它依然在附近徘徊。']],
  [['And waited patiently outside,', '它在外面耐心等待，'], ['Outside, outside,', '在外面，在外面，'], ['And waited patiently outside', '它在外面耐心等待，'], ['Till Mary did appear.', '直到玛丽出现。']],
  [['Why does the lamb love Mary so,', '为什么小羊这样爱玛丽，'], ['Mary so, Mary so?', '这样爱，这样爱？'], ['Why does the lamb love Mary so?', '为什么小羊这样爱玛丽？'], ['The eager children cried.', '孩子们好奇地问。']],
  [['Why Mary loves the lamb, you know,', '因为玛丽也爱着小羊，'], ['The lamb, you know, the lamb, you know.', '爱着小羊，爱着小羊。'], ['Why Mary loves the lamb, you know,', '因为玛丽也爱着小羊，'], ['The teacher did reply.', '老师这样回答。']],
  [['Mary had a little lamb,', '玛丽有只小羊羔，'], ['Little lamb, little lamb.', '小羊羔，小羊羔。'], ['Mary had a little lamb,', '玛丽有只小羊羔，'], ['Little lamb, little lamb.', '小羊羔，小羊羔。'], ['Mary had a little lamb,', '玛丽有只小羊羔，'], ['Whose fleece was white as snow.', '羊毛洁白像雪花。']]
];
const twinkleExtra = [
  ['When the blazing sun is set,', '当明亮的太阳落下，'], ['And the grass with dew is wet.', '草地沾上晶莹露水。'],
  ['Then you show your little light,', '你便亮起小小的光，'], ['Twinkle, twinkle all the night.', '整夜一闪一闪发亮。'], ...twinkleVerse.slice(4),
  ['Then the traveler in the dark', '这时黑暗中的旅人，'], ['Thanks you for your tiny spark.', '感谢你那微小的光。'],
  ['How could he see where to go', '他怎能看清前方的路，'], ['If you did not twinkle so?', '如果没有你这样闪亮？'], ...twinkleVerse.slice(4),
  ['As your bright and tiny spark', '你那明亮小小的光，'], ['Lights the traveler in the dark,', '照亮了黑暗中的旅人，'],
  ['Though I know not what you are,', '虽然我还不知道你是什么，'], ['Twinkle, twinkle, little star.', '一闪一闪，小星星。'], ...twinkleVerse.slice(4)
];
const maryRecordingVerses = [
  maryVerses[0].map((line, i) => i === 3 ? ['Its fleece was white as snow.', '羊毛洁白像雪花。'] : line), maryVerses[1],
  maryVerses[2].map((line, i) => i === 3 ? ['Which was against the rule.', '可这违反了学校的规定。'] : line), maryVerses[3],
  [['And so the teacher sent it out,', '于是老师请它离开，'], ['Sent it out, sent it out.', '请它离开，请它离开。'], ['And so the teacher sent it out,', '于是老师请它离开，'], ['But still it lingered near.', '可它依然在附近徘徊。']],
  [['It stood and waited round about,', '它站在外面耐心等待，'], ['Round about, round about.', '在外面，在外面。'], ['It stood and waited round about,', '它站在外面耐心等待，'], ['Till Mary did appear.', '直到玛丽出现。']],
  maryVerses[7].map((line, i) => i === 3 ? ['The little children cry.', '小朋友们这样问。'] : line)
];
const alphabetVerse = [
  ['A, B, C, D, E, F, G,', 'A、B、C、D、E、F、G，'], ['H, I, J, K, L, M, N, O, P,', 'H、I、J、K、L、M、N、O、P，'],
  ['Q, R, S, and T,', 'Q、R、S，还有 T，'], ['U, V, W, X, and Y, and Z.', 'U、V、W、X，还有 Y 和 Z。'],
  ['Happy, happy we shall be,', '我们会多么快乐，'], ['When we learn our ABCs.', '当我们学会了英文字母。']
];
const teachingSource = 'https://americanenglish.state.gov/resources/sing-out-loud-childrens-songs';
const audioRoot = 'https://americanenglish.state.gov/files/ae/resource_files/';
const englishSongs = [
  { id: 'twinkle', videoId: 'yCjJyiqpAuU', title: 'Twinkle, Twinkle, Little Star', chinese: '小星星', icon: '🌟', author: 'American English · Sing Out Loud', source: teachingSource, audioSource: audioRoot + '05-5-twinkle_0.mp3', description: '真人演唱 + 音乐伴奏 · 完整版 2分16秒。学习 star（星星）和 sky（天空）。', lines: [...twinkleVerse, ...twinkleExtra].map((line, i) => [7 + i * 5, ...line]) },
  { id: 'mary', videoId: 'N7Z2Un0oxow', title: 'Mary Had a Little Lamb', chinese: '玛丽有只小羊羔', icon: '🐑', author: 'American English · Sing Out Loud', source: teachingSource, audioSource: audioRoot + '06-6-mary-lamb_0.mp3', description: '真人演唱 + 音乐伴奏 · 完整版 1分49秒。学习 lamb（小羊）和 snow（雪）。', lines: maryRecordingVerses.flat().map((line, i) => [5 + i * 3.6, ...line]) },
  { id: 'alphabet', videoId: 'vD98OvvDNEs', title: 'The Alphabet Song', chinese: '英文字母歌', icon: '🔤', author: 'American English · Sing Out Loud', source: teachingSource, audioSource: audioRoot + '01-1-alphabet_0.mp3', description: '真人演唱 + 音乐伴奏 · 完整版 1分36秒。跟着旋律唱出 26 个英文字母。', lines: [...alphabetVerse, ...alphabetVerse, ...alphabetVerse].map((line, i) => [6 + i * 4.8, ...line]) }
];
