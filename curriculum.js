'use strict';
// Local practice banks: age bands are guidance, and difficulty remains freely selectable.
const vocabulary = [
 ['Apple','苹果','แอปเปิล','🍎'],['Cat','猫','แมว','🐱'],['Sun','太阳','ดวงอาทิตย์','☀️'],['Tree','树','ต้นไม้','🌳'],
 ['Dog','狗','สุนัข','🐶'],['Fish','鱼','ปลา','🐟'],['Bird','鸟','นก','🐦'],['House','房子','บ้าน','🏠'],
 ['Book','书','หนังสือ','📚'],['Ball','球','ลูกบอล','⚽'],['Flower','花','ดอกไม้','🌸'],['Moon','月亮','ดวงจันทร์','🌙']
];
const phrases = ['Red apple','Small cat','Yellow sun','Green tree','Brown dog','Blue fish','Little bird','Big house','My book','Round ball','Pink flower','White moon'];
const sentences = ['I like apples','This is my cat','The sun is yellow','I see a green tree','My dog can run','The fish can swim','The bird can fly','This is my house','I read a book','I have a ball','The flower is pink','I see the moon'];
function englishItem(word, item, task, reading = '') {
 return { word, translation: `${item[1]} · ${item[2]}`, icon: item[3], color_hint: '#3884ea', guide_shape: '', task, reading };
}
const questions = ['What fruit do you like?','What animal is this?','What color is the sun?','What do you see?','What can your dog do?','What can a fish do?','What can a bird do?','Where do you live?','What do you read?','What do you have?','What color is the flower?','What can you see at night?'];
const readingFacts = [
 ['Mia has a red apple. She eats it after school.','What fruit does Mia have?','An apple','画出米娅的水果','วาดผลไม้ของมีอา'],
 ['Tom has two cats. They sleep on a chair.','How many cats does Tom have?','Two cats','画出汤姆的猫','วาดแมวของทอม'],
 ['The sun is yellow. We play outside in the morning.','What color is the sun?','Yellow','画出早晨的太阳','วาดดวงอาทิตย์ตอนเช้า'],
 ['A green tree stands near our house. Birds live in it.','Where do the birds live?','In a tree','画出鸟的家','วาดบ้านของนก'],
 ['Ben has a dog. His dog runs in the park.','Where does the dog run?','In the park','画出公园','วาดสวนสาธารณะ'],
 ['A fish lives in water. It swims with other fish.','Where does a fish live?','In water','画出鱼生活的地方','วาดที่อยู่ของปลา'],
 ['A bird has two wings. It flies over the garden.','How many wings does a bird have?','Two wings','画出鸟的翅膀','วาดปีกนก'],
 ['Our house has a blue door and three windows.','How many windows are there?','Three windows','画出这栋房子','วาดบ้านหลังนี้'],
 ['Lily reads a book every evening. Her book is about animals.','What is the book about?','Animals','画出书中的动物','วาดสัตว์ในหนังสือ'],
 ['Sam plays with a ball. He plays with his sister.','Who plays with Sam?','His sister','画出一起玩球的人','วาดคนที่เล่นบอลด้วยกัน'],
 ['The garden has pink flowers. Bees visit them.','What color are the flowers?','Pink','画出花园','วาดสวนดอกไม้'],
 ['At night we see the moon. The sky is dark.','When do we see the moon?','At night','画出夜空','วาดท้องฟ้าตอนกลางคืน']
];
const grammar = [
 ['She ___ a book every day. (read / reads)','She reads a book every day'],['They ___ football on Sundays. (play / plays)','They play football on Sundays'],
 ['There ___ two birds in the tree. (is / are)','There are two birds in the tree'],['I ___ a blue bag. (have / has)','I have a blue bag'],
 ['He ___ swim well. (can / cans)','He can swim well'],['We ___ happy today. (is / are)','We are happy today'],
 ['The cat is ___ the table. (under)','The cat is under the table'],['This apple is ___ than that one. (big / bigger)','This apple is bigger than that one'],
 ['Yesterday I ___ to the park. (walk / walked)','Yesterday I walked to the park'],['She is ___ a picture now. (draw / drawing)','She is drawing a picture now'],
 ['I have three ___. (box / boxes)','I have three boxes'],['___ you like apples? (Do / Does)','Do you like apples']
];
const englishBanks = {
 '6-7': {
  easy: vocabulary.map((v,i) => englishItem(v[0],v,`画出${v[1]}，听开头字母 ${v[0][0]}，读出并拼写单词。 · Draw, listen to the first letter, say and spell. · วาด ฟังอักษรตัวแรก อ่านและสะกด`, '')),
  medium: vocabulary.map((v,i) => englishItem(phrases[i],v,'画出词组的意思，再读出并输入完整词组。 · Draw, say and type the phrase. · วาด อ่านและพิมพ์วลี')),
  hard: vocabulary.map((v,i) => englishItem(sentences[i],v,'画出句子的意思，读出并输入整句。 · Draw, say and type the sentence. · วาด อ่านและพิมพ์ประโยค'))
 },
 '8-9': {
  easy: [['School','学校','โรงเรียน','🏫'],['Teacher','老师','ครู','🧑‍🏫'],['Breakfast','早餐','อาหารเช้า','🍳'],['Family','家人','ครอบครัว','🏡'],['Kitchen','厨房','ห้องครัว','🍽️'],['Library','图书馆','ห้องสมุด','📚'],['Rainy','下雨的','ฝนตก','🌧️'],['Sunny','晴朗的','แดดออก','☀️'],['Bicycle','自行车','จักรยาน','🚲'],['Elephant','大象','ช้าง','🐘'],['Vegetables','蔬菜','ผัก','🥕'],['Saturday','星期六','วันเสาร์','📅']].map(v => englishItem(v[0],v,'画一个相关场景，读出并拼写主题词。 · Draw a scene, say and spell. · วาดฉาก อ่านและสะกด')),
  medium: vocabulary.map((v,i) => englishItem(sentences[i],v,`${questions[i]} · 按示例回答并画出来。 · Say and type the model answer; draw it. · ตอบตามตัวอย่างแล้ววาด`)),
  hard: readingFacts.map((r,i) => englishItem(r[2],vocabulary[i],`${r[1]} · ${r[3]}，用英语回答。 · Answer in English. · ${r[4]} แล้วตอบภาษาอังกฤษ`,r[0]))
 },
 '10': {
  easy: grammar.map((r,i) => englishItem(r[1],vocabulary[i],`${r[0]} · 补全后读出并输入整句，画图帮助理解。 · Complete, say and type the sentence. · เติม อ่านและพิมพ์ประโยค`)),
  medium: readingFacts.map((r,i) => englishItem(r[2],vocabulary[i],`${r[1]} · 找出短文中的依据，画图并回答。 · Find evidence, draw and answer. · หาคำตอบจากเรื่อง วาดแล้วตอบ`, `${r[0]} After that, the family talks about their day.`)),
  hard: sentences.map((line,i) => englishItem(`${line} and I am happy`,vocabulary[i],'用 and 连接两句，读出并输入完整示例，画出自己的故事。 · Join ideas with and; say and type the model. · เชื่อมประโยคด้วย and อ่านและพิมพ์ตัวอย่าง',`${line}. I am happy.`))
 }
};
function mathItem(title, answer, prompt) { return { title, answer, prompt, groups: [] }; }
const solvePrompt = '可以画数轴、拆分或分组，答案只填数字。 · Draw to solve; enter a number. · วาดช่วยคิด แล้วตอบเป็นตัวเลข';
function sums(limit, count) { return Array.from({length:count},(_,i) => { const a = limit === 20 ? 7+i%9 : 27+i*3, b = limit === 20 ? 1+i%5 : 12+i%18, op = i%2 ? '−' : '+'; return mathItem(`${a} ${op} ${b} = ?`,op === '+' ? a+b : a-b,solvePrompt); }); }
const mathBanks = {
 '6-7': {
  easy: Array.from({length:15},(_,i) => i%3 === 0 ? mathItem(`${i+2} 和 ${i+4} · and · และ`,i+4,'哪个数更大？ · Which number is larger? · จำนวนใดมากกว่า') : mathItem(`${i+1}, ${i+2}, ?`,i+3,'继续数数，下一个数是多少？ · What comes next? · จำนวนถัดไปคืออะไร')),
  medium: sums(20,20),
  hard: [mathItem('△',3,'三角形有几条边？ · How many sides? · สามเหลี่ยมมีกี่ด้าน'),mathItem('□',4,'正方形有几条边？ · How many sides? · สี่เหลี่ยมจัตุรัสมีกี่ด้าน'),mathItem('⬟',5,'五边形有几条边？ · How many sides? · ห้าเหลี่ยมมีกี่ด้าน'),...sums(20,17)]
 },
 '8-9': {
  easy: sums(100,20),
  medium: Array.from({length:20},(_,i) => { const a=2+i%8,b=2+(i*3)%8; return mathItem(i%2 ? `${a*b} ÷ ${a} = ?` : `${a} × ${b} = ?`,i%2 ? b : a*b,solvePrompt); }),
  hard: Array.from({length:20},(_,i) => i%2 ? mathItem(`${2+i%8}:00 → ${3+i%8}:30`,90,'经过多少分钟？ · How many minutes pass? · ผ่านไปกี่นาที') : mathItem(`${20+i*2} ฿ − ${7+i} ฿ = ?`,13+i,'付钱后剩多少泰铢？ · How many baht remain? · เหลือเงินกี่บาท'))
 },
 '10': {
  easy: Array.from({length:20},(_,i) => { const a=127+i*23,b=48+i*7; return mathItem(i%2 ? `${a} − ${b} = ?` : `${a} + ${b} = ?`,i%2 ? a-b : a+b,solvePrompt); }),
  medium: Array.from({length:20},(_,i) => i%2 ? mathItem(`${(10+i)/10} + 0.5 = ?`,(15+i)/10,'小数加法，注意小数点对齐。 · Align decimal points. · จัดจุดทศนิยมให้ตรงกัน') : mathItem(`1/${2+i%4} + 1/${2+i%4} = ?`,2/(2+i%4),'同分母分数相加，可填分数或小数。 · Enter a fraction or decimal. · ตอบเป็นเศษส่วนหรือทศนิยม')),
  hard: Array.from({length:20},(_,i) => {const a=3+i%8,b=2+i%6;return mathItem(`${a} cm × ${b} cm`,i%2 ? 2*(a+b) : a*b,i%2 ? '画出长方形，求周长（cm）。 · Find the perimeter (cm). · หาความยาวรอบรูป (cm)' : '画出长方形，求面积（cm²）。 · Find the area (cm²). · หาพื้นที่ (cm²)');})
 }
};
const ageDescriptions = {
 '6-7': { english: '字母、单词、词组与简单句 · Letters, words and sentences · อักษร คำศัพท์และประโยค', math: '数与大小、20以内加减、图形 · Numbers, sums to 20 and shapes · จำนวน บวกลบไม่เกิน 20 และรูปทรง' },
 '8-9': { english: '主题词汇、问答与短文 · Vocabulary, questions and reading · คำศัพท์ ถามตอบและอ่าน', math: '100以内加减、乘除、时间与钱币 · Sums to 100, times tables, time and money · บวกลบไม่เกิน 100 คูณหาร เวลาและเงิน' },
 '10': { english: '语法、阅读与引导表达 · Grammar, reading and guided writing · ไวยากรณ์ อ่านและเขียนตามตัวอย่าง', math: '多位数、分数、小数、面积与周长 · Larger numbers, fractions, decimals, area and perimeter · จำนวนหลายหลัก เศษส่วน ทศนิยม พื้นที่และรอบรูป' }
};

englishBanks['6-7'].easy.forEach((item,i) => { if (i < levels.length) { item.guide_shape = levels[i].guide_shape; item.color_hint = levels[i].color_hint; } });

// Longer responses use topic labels rather than presenting a single noun as a sentence translation.
for (const age of Object.keys(englishBanks)) for (const difficulty of ['easy','medium','hard']) {
 if (age !== '6-7' || difficulty !== 'easy') englishBanks[age][difficulty].forEach(item => { item.translation = `主题 · Topic · หัวข้อ: ${item.translation}`; });
}
