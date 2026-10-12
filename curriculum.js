'use strict';
// Original exercises organised using publicly described Cambridge Primary subject progression.
// A selected stage is an ability choice, not an official grade-placement assessment.
const recommendedStages = { '6-7':'2', '8-9':'4', '10':'6' };
const stageProfiles = {
 '1': {english:'个人信息、课堂物品、简单描述 · Personal information and classroom words · ข้อมูลส่วนตัวและคำในห้องเรียน',math:'20以内加减、缺数与简单数量关系 · Sums to 20 and missing numbers · บวกลบไม่เกิน 20 และเติมจำนวน'},
 '2': {english:'家庭、食物、颜色和日常简单句 · Family, food and everyday sentences · ครอบครัว อาหารและประโยคทั่วไป',math:'100以内加减、2/5/10倍数组、半与四分之一 · Sums to 100, groups, halves and quarters · บวกลบไม่เกิน 100 กลุ่ม ครึ่งและหนึ่งในสี่'},
 '3': {english:'学校生活、日常习惯、短文细节 · School routines and reading details · กิจวัตรโรงเรียนและรายละเอียดเรื่อง',math:'三位数、乘除、同分母分数和时间 · Three-digit numbers, times tables, fractions and time · จำนวนสามหลัก คูณหาร เศษส่วนและเวลา'},
 '4': {english:'活动与经历、连接句子、语境理解 · Events, connected sentences and context · เหตุการณ์ ประโยคเชื่อมและบริบท',math:'整数混合运算、等值分数、面积周长、数据 · Mixed operations, equivalent fractions, measure and data · คำนวณผสม เศษส่วนเท่ากัน การวัดและข้อมูล'},
 '5': {english:'信息文本、比较、原因与证据 · Informational texts, comparisons and reasons · ข้อความข้อมูล เปรียบเทียบและเหตุผล',math:'小数位值、小数计算、分数与百分数互化 · Decimals, fractions and percentage equivalence · ทศนิยม เศษส่วนและเปอร์เซ็นต์'},
 '6': {english:'观点、推断、条件与未来计划 · Opinions, inference, conditions and plans · ความคิดเห็น อนุมาน เงื่อนไขและแผน',math:'分数乘除、百分数、比、负数与综合应用 · Fraction operations, percentages, ratio and applications · คำนวณเศษส่วน เปอร์เซ็นต์ อัตราส่วนและโจทย์ผสม'}
};
function mathItem(title,answer,topic,prompt='') { return {title,answer,topic,groups:[],prompt:`${topic} · ${prompt || '画图帮助理解，答案只填数字或分数。 · Draw to reason; enter a number or fraction. · วาดช่วยคิด ตอบเป็นตัวเลขหรือเศษส่วน'}`}; }
const englishBanks={},mathBanks={};
const englishSeeds = {
 '1': [
 ['Hello','Hello, my name is Mia','Mia greets a new friend. Her name is Mia.','What is her name?','Mia'],
 ['Pencil','This is a pencil','A boy puts a pencil in his bag.','What does he put in his bag?','A pencil'],
 ['Desk','The desk is big','The teacher has a big desk.','What is big?','The desk'],
 ['Chair','This chair is blue','A girl sits on a blue chair.','What color is the chair?','Blue'],
 ['Hand','This is my hand','I raise my hand to speak.','What do I raise?','My hand'],
 ['Eye','I have two eyes','A child draws two eyes on a face.','How many eyes?','Two'],
 ['Red','It is red','The teacher holds a red card.','What color is the card?','Red'],
 ['Blue','It is blue','A blue cup is on the desk.','What is on the desk?','A blue cup'],
 ['Happy','I am happy','Mia smiles. She feels happy.','How does Mia feel?','Happy'],
 ['Sad','I am sad','Tom feels sad when his toy breaks.','How does Tom feel?','Sad'],
 ['Stand','Please stand up','The class stands when the teacher asks.','What do the children do?','They stand'],
 ['Sit','Please sit down','The teacher asks the class to sit.','What does the teacher ask?','Sit down'] ],
 '2': [
 ['Apple','Red apple','Mia packs an apple for lunch. It is red.','What does Mia pack?','An apple'],
 ['Cat','Small cat','A small cat sleeps near the door.','Where does the cat sleep?','Near the door'],
 ['Sun','Yellow sun','The sun shines over the garden.','What shines?','The sun'],
 ['Tree','Green tree','A green tree grows beside our house.','What grows beside the house?','A tree'],
 ['Mother','My mother cooks','My mother makes rice for dinner.','What does she make?','Rice'],
 ['Brother','My brother can swim','Ben is my brother. He swims after school.','What can Ben do?','Swim'],
 ['Breakfast','I eat breakfast','I eat eggs for breakfast before school.','What do I eat?','Eggs'],
 ['Water','I drink water','I drink water after playing.','What do I drink?','Water'],
 ['Bedroom','This is my bedroom','My bed is in my bedroom.','Where is my bed?','In my bedroom'],
 ['Garden','We play in the garden','We play ball in the garden.','Where do we play?','In the garden'],
 ['Shoes','My shoes are black','I wear black shoes to school.','What color are my shoes?','Black'],
 ['Dress','The dress is pink','Sara wears a pink dress.','What does Sara wear?','A pink dress'] ],
 '3': [
 ['Classroom','We study in the classroom','Our class reads together in the classroom every morning.','Where do we read?','In the classroom'],
 ['Timetable','We follow a timetable','Our timetable shows art on Tuesday and music on Thursday.','When is art?','On Tuesday'],
 ['Homework','I do my homework after school','I finish homework before I play outside.','What do I do first?','Homework'],
 ['Bicycle','I ride a bicycle to school','Leo rides to school because it is near his home.','How does Leo travel?','By bicycle'],
 ['Library','We borrow books from the library','Nina borrows a science book from the school library.','What book does Nina borrow?','A science book'],
 ['Usually','I usually get up at seven','On school days Sam gets up at seven. On Sunday he gets up at eight.','When does Sam get up on school days?','At seven'],
 ['Weekend','I visit my grandparents at the weekend','Every Saturday we visit our grandparents. We help in their garden.','Who do we visit?','Our grandparents'],
 ['Lunch','We eat lunch at noon','The pupils eat lunch at twelve. Then they play.','When is lunch?','At twelve'],
 ['Sport','My favorite sport is tennis','Ava likes tennis more than football.','What sport does Ava prefer?','Tennis'],
 ['Weather','It is windy today','The wind moves the leaves and a kite flies high.','What is the weather like?','Windy'],
 ['Music','She plays music after school','Rita plays the piano after school before dinner.','What instrument does Rita play?','The piano'],
 ['Practice','I practice reading every day','Omar reads a page each day to improve.','How often does Omar read?','Every day'] ],
 '4': [
 ['Museum','We visited a museum yesterday','Our class visited a museum yesterday. We saw old boats and drew them in notebooks.','What did the class see?','Old boats'],
 ['Journey','The journey took two hours','A bus journey took two hours. We stopped once to eat.','How long did the journey take?','Two hours'],
 ['Although','Although it rained, we played inside','It rained all morning. Instead of going outside we played board games indoors.','Where did we play?','Indoors'],
 ['Before','We washed our hands before lunch','First we washed our hands. Next we ate lunch. Finally we cleaned the table.','What happened before lunch?','We washed our hands'],
 ['After','After the match, we thanked the coach','The team lost but thanked the coach for helping them.','Who did the team thank?','The coach'],
 ['Because','I wore a coat because it was cold','The temperature fell. Mila put on a coat to stay warm.','Why did Mila wear a coat?','It was cold'],
 ['While','I read while my sister painted','Two sisters spent an afternoon at home. One read a story and the other painted a landscape.','What did the other sister do?','She painted'],
 ['Experiment','We recorded the experiment results','We planted seeds in two pots. One pot had water and the other did not.','How many pots did we use?','Two pots'],
 ['Invitation','I wrote an invitation to my friend','Zoe invited her friend to a picnic next Saturday.','When is the picnic?','Next Saturday'],
 ['Directions','Turn left at the school','Walk past the park. At the school turn left to find the library.','Where should you turn left?','At the school'],
 ['Describe','Please describe the animal','The creature has soft fur, long ears and likes carrots.','Which animal fits the description?','A rabbit'],
 ['Compare','This bridge is longer than that bridge','The old bridge is ten metres long. The new bridge is fifteen metres long.','Which bridge is longer?','The new bridge'] ],
 '5': [
 ['Habitat','A habitat provides food and shelter','A wetland gives birds food and shelter. When it dries out, the birds must move.','Why must the birds move?','The wetland dries out'],
 ['Recycle','We recycle paper to reduce waste','A club collects used paper each Friday. The paper is sent to be recycled rather than thrown away.','What does the club collect?','Used paper'],
 ['Evidence','The footprints are evidence of an animal','A researcher finds fresh footprints beside a river. The tracks suggest an animal visited recently.','What suggests a recent visit?','Fresh footprints'],
 ['Opinion','I think walking is better for short trips','Maya says walking is the best way to travel nearby. Her friend prefers a bicycle.','Who prefers walking?','Maya'],
 ['Population','The population of the town has grown','A town had fewer residents last year. New homes attracted families and now more people live there.','Why did families move there?','New homes'],
 ['Resource','Clean water is a valuable resource','Our class checks taps after lessons because wasting water reduces an important resource.','What resource do we protect?','Clean water'],
 ['Pollution','Pollution can harm river animals','Litter enters a stream after a storm. Volunteers collect it to protect fish.','Who collects the litter?','Volunteers'],
 ['Temperature','The temperature is higher in the afternoon','A thermometer shows eighteen degrees at dawn and twenty six at noon.','When is it warmer?','At noon'],
 ['Conserve','We should conserve electricity','The school switches off lights in empty rooms to use less electricity.','How does the school save electricity?','It switches off lights'],
 ['Balance','A balanced diet includes different foods','An athlete eats vegetables, fruit and grains instead of only sweets.','What does the athlete avoid eating alone?','Sweets'],
 ['Information','We checked the information in two books','Two books gave different dates. A learner checked a museum website before writing.','Why did the learner check another source?','The dates were different'],
 ['Conclusion','Our conclusion is based on the results','Two plants were observed for a month. The watered plant grew more, supporting our conclusion.','Which plant grew more?','The watered plant'] ],
 '6': [
 ['Prediction','If it rains, we will stay inside','Dark clouds gather and the forecast predicts rain. The group plans indoor games if the rain starts.','What will the group do if it rains?','Play indoor games'],
 ['Persuade','We should walk because it reduces pollution','A pupil asks classmates to walk short distances. She explains that fewer car journeys mean cleaner air.','What reason supports walking?','Cleaner air'],
 ['Inference','The wet ground suggests that it rained','The sky is clear now but the road is wet and umbrellas are drying by the door.','What probably happened earlier?','It rained'],
 ['Alternative','We could take the train instead of driving','The train uses less fuel per traveller. The family chooses it even though they must leave earlier.','Which transport did they choose?','The train'],
 ['Reliable','We need a reliable source for our report','A writer compares an unnamed post with a measured weather record before describing a storm.','Which source is more reliable?','The weather record'],
 ['Responsibility','Everyone has a responsibility to protect nature','A class assigns jobs for a cleanup. Each pupil completes a task so the shared space becomes cleaner.','Why does each pupil have a job?','To share the work'],
 ['Contrast','The first plan is cheaper but the second is faster','Two travel plans have different costs and journey times. A family with little time chooses the faster plan.','Which plan does the family choose?','The second plan'],
 ['Consequence','If we waste water, there may be less for everyone','A village has limited water in summer. Residents repair leaks before shortages become worse.','Why do residents repair leaks?','To save water'],
 ['Evaluate','We should evaluate both benefits and costs','A new playground would create space to exercise but would remove part of a garden. Residents discuss both effects.','What would be removed?','Part of a garden'],
 ['Future','I will volunteer at the library next month','Noah plans to help younger readers next month. He asks a librarian how to prepare.','Who will Noah help?','Younger readers'],
 ['Summary','A summary includes the main ideas','An article describes a forest and its animals in detail. A learner writes a short version using its key points.','What should the short version include?','The key points'],
 ['Justify','We must justify our decision with evidence','The team chooses a safer route after studying maps and weather reports rather than guessing.','What supports the decision?','Maps and weather reports'] ]
};
for (const stage of Object.keys(stageProfiles)) {
 const seeds=englishSeeds[stage];
 const item=(word,reading,task,topic) => ({word,reading,task,topic,translation:'',icon:'📚',color_hint:'#3884ea',guide_shape:''});
 englishBanks[stage]={
  easy:seeds.map(r=>item(r[0],'','画出主题场景，听读并拼写关键词。 · Draw, say and spell the key word. · วาด อ่านและสะกดคำสำคัญ','Vocabulary · 词汇 · คำศัพท์')),
  medium:seeds.map(r=>item(r[1],'','读出并输入完整示例句，画图帮助理解。 · Say and type the model sentence. · อ่านและพิมพ์ประโยคตัวอย่าง','Sentence use · 句子运用 · การใช้ประโยค')),
  hard:seeds.map(r=>item(r[4],r[2],`${r[3]} · 按短文回答，可先听示例。 · Answer from the passage; listen to a model if needed. · ตอบจากเรื่อง ฟังตัวอย่างได้`,'Reading detail / inference · 阅读细节与推断 · รายละเอียดและอนุมาน'))
 };
}
const numericPrompt='答案只填数字、分数或小数。 · Enter a number, fraction or decimal. · ตอบเป็นตัวเลข เศษส่วนหรือทศนิยม';
for (const stage of Object.keys(stageProfiles)) {
 const bank={easy:[],medium:[],hard:[]};
 for (let i=0;i<24;i++) {
  let e,m,h;
  if (stage==='1') {
   const a=7+i%5,b=3+i%4,total=a+b;
   e=mathItem(`${a} + ${b} = ?`,total,'Addition within 20 · 20以内加法 · บวกไม่เกิน 20');
   m=mathItem(`${total} − ? = ${a}`,b,'Missing number within 20 · 缺数关系 · เติมจำนวน');
   h=mathItem(`${total} − ${b} + 2 = ?`,a+2,'Number story · 数量关系 · เรื่องจำนวน',`原有 ${total} 支笔，送出 ${b} 支，再得到2支，还剩多少？ · Give away ${b} of ${total} pencils, then get 2. How many remain? · มี ${total} แท่ง ให้ไป ${b} แล้วได้เพิ่ม 2 เหลือเท่าไร`);
  } else if (stage==='2') {
   const a=24+i,b=17+i%9,f=[2,5,10][i%3],n=3+i%7;
   e=mathItem(`${a} + ${b} = ?`,a+b,'Two-digit addition · 两位数加法 · บวกสองหลัก');
   m=mathItem(`${f} × ${n} = ?`,f*n,'Equal groups: 2, 5, 10 · 等量分组 · กลุ่มเท่ากัน');
   h=i%2 ? mathItem(`${a+b} ฿ − ${b} ฿ = ?`,a,'Money and change · 钱币找零 · เงินทอน') : mathItem(`${2*n} ÷ 2 = ?`,n,'Half a quantity · 数量的一半 · ครึ่งหนึ่งของจำนวน');
  } else if (stage==='3') {
   const a=126+i*11,b=38+i*2,n=3+i%6,d=4+i%5;
   e=mathItem(`${a} − ${b} = ?`,a-b,'Three-digit subtraction · 三位数减法 · ลบสามหลัก');
   m=i%2 ? mathItem(`${a*n} ÷ ${n} = ?`,a,'Division by one digit · 一位数除法 · หารด้วยหนึ่งหลัก') : mathItem(`${a} × ${n} = ?`,a*n,'Multiplication by one digit · 一位数乘法 · คูณด้วยหนึ่งหลัก');
   h=i%3===0 ? mathItem(`1/${d} + 2/${d} = ?`,3/d,'Same-denominator fractions · 同分母分数 · เศษส่วนตัวส่วนเท่ากัน') : i%3===1 ? mathItem('09:10 → 09:45',35,'Time interval · 时间间隔 · ช่วงเวลา',numericPrompt+' How many minutes? · 多少分钟？ · กี่นาที') : mathItem(`${n}, ${n+2}, ${n+4}`,3*n+6,'Total from data · 数据总量 · ผลรวมข้อมูล',numericPrompt+' Find the total. · 求总量。 · หาผลรวม');
  } else if (stage==='4') {
   const a=1024+i*73,b=148+i*19,w=4+i%5,hg=3+i%4;
   e=mathItem(`${a} + ${b} − 125 = ?`,a+b-125,'Whole-number operations · 整数混合运算 · คำนวณจำนวนเต็ม');
   m=mathItem(`${a} × ${12+i%7} = ?`,a*(12+i%7),'Two-digit multiplier · 两位数乘数 · ตัวคูณสองหลัก');
   h=i%3===0 ? mathItem(`2/${4+i%3} = ?/${(4+i%3)*3}`,6,'Equivalent fractions · 等值分数 · เศษส่วนเท่ากัน',numericPrompt+' Enter the missing numerator. · 填分子。 · เติมตัวเศษ') : i%3===1 ? mathItem(`${w} cm × ${hg} cm`,2*(w+hg),'Rectangle perimeter · 长方形周长 · รอบรูปสี่เหลี่ยม',numericPrompt+' Find perimeter. · 求周长。 · หารอบรูป') : mathItem(`${w}, ${w+2}, ${w+4}`,w+2,'Mean of data · 数据平均数 · ค่าเฉลี่ย',numericPrompt+' Find the mean. · 求平均数。 · หาค่าเฉลี่ย');
  } else if (stage==='5') {
   const a=12+i,b=5+i%8;
   e=mathItem(`${(a/10).toFixed(1)} × 10 = ?`,a,'Decimal place value · 小数位值 · ค่าประจำหลักทศนิยม');
   m=i%2 ? mathItem(`${(a/10).toFixed(1)} × ${b} = ?`,a*b/10,'Decimal times whole number · 小数乘整数 · ทศนิยมคูณจำนวนเต็ม') : mathItem(`${(a/10).toFixed(1)} + ${(b/10).toFixed(1)} = ?`,(a+b)/10,'Decimal addition · 小数加法 · บวกทศนิยม');
   h=i%3===0 ? mathItem(`${2+i%7}/10 = ?%`,(2+i%7)*10,'Fraction to percentage · 分数与百分数 · เศษส่วนเป็นเปอร์เซ็นต์',numericPrompt+' Enter the percent number without %. · 只填百分数数字。 · ใส่ตัวเลขไม่ใส่ %') : i%3===1 ? mathItem(`1/${2+i%4} of ${(2+i%4)*b} = ?`,b,'Fraction of a quantity · 数量的分数 · เศษส่วนของจำนวน') : mathItem(`${(a/10).toFixed(1)} m × 3 m`,a*3/10,'Area with decimal lengths · 小数长度面积 · พื้นที่จากความยาวทศนิยม',numericPrompt+' Find area in square metres. · 求平方米数。 · หาพื้นที่เป็นตารางเมตร');
  } else {
   const d=3+i%4,n=12+i*2,p=10+(i%6)*5;
   e=i%2 ? mathItem(`2/${d} ÷ 2 = ?`,1/d,'Fraction division · 分数除法 · หารเศษส่วน') : mathItem(`1/${d} + 1/${d*2} = ?`,3/(2*d),'Different denominators · 异分母分数 · ตัวส่วนต่างกัน');
   m=i%2 ? mathItem(`2:3 · Total ${n*5}`,n*2,'Ratio allocation · 按比分配 · แบ่งตามอัตราส่วน',numericPrompt+' Find the first share. · 求第一份数量。 · หาส่วนแรก') : mathItem(`${p}% of ${n*20} = ?`,n*20*p/100,'Percentage of a quantity · 百分数应用 · เปอร์เซ็นต์ของจำนวน');
   h=i%3===0 ? mathItem(`−${n} + ${n-5} = ?`,-5,'Negative-number change · 负数变化 · การเปลี่ยนจำนวนลบ') : i%3===1 ? mathItem(`${n*20} − ${p}% of ${n*20} = ?`,n*20*(1-p/100),'Discount reasoning · 折扣综合应用 · คำนวณส่วนลด') : mathItem(`${n}, ${n+4}, ${n+8}, ${n+12}`,n+6,'Mean and data reasoning · 平均数推理 · เหตุผลจากค่าเฉลี่ย',numericPrompt+' Find the mean. · 求平均数。 · หาค่าเฉลี่ย');
  }
  bank.easy.push(e);bank.medium.push(m);bank.hard.push(h);
 }
 mathBanks[stage]=bank;
}

englishBanks['2'].easy.slice(0,4).forEach((item,index)=>{item.guide_shape=levels[index].guide_shape;item.color_hint=levels[index].color_hint;});
