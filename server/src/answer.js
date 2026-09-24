const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const THAI_NUMBERS = { หนึ่ง: 1, นึง: 1, สอง: 2, สาม: 3, สี่: 4, ห้า: 5, หก: 6, เจ็ด: 7, แปด: 8, เก้า: 9, สิบ: 10, สิบเอ็ด: 11, สิบสอง: 12 };
const EXAMPLES = ['สอนวิชาอะไรบ้าง', 'สอนวันไหนบ้าง', 'วันจันทร์สอนกี่คาบ', 'คาบละกี่ชั่วโมง'];
const OUT_OF_SCOPE = /(?:ignore|override|system|prompt|password|token|api key|ลืมคำสั่ง|ละเลย|ไม่ต้องสน|ไม่สนใจ|คำสั่งก่อน|คำสั่งเดิม|แกล้ง|สมมติ|แต่ง(?:คำตอบ|ข้อมูล|เรื่อง|เพลง|กลอน)|เขียน(?:โค้ด|โปรแกรม)|อากาศ|อาหาร|ข่าว|ฟุตบอล|หวย|หุ้น|การเมือง|แฮก|อธิบาย|ความหมาย|คืออะไร|สรุปเนื้อหา)/i;
const REFUSAL ='ตอบให้ไม่ได้ค่ะ ฉันตอบได้เฉพาะข้อมูลในตารางสอนนี้ เช่น วัน เวลา วิชา ห้องเรียน กลุ่มเรียน และข้อมูลครู กรุณาถามเฉพาะเรื่องที่มีในตาราง';
// Injection attempts and requests mixed with schedule filters get the plain
// refusal. Purely off-topic chat gets a light, still-firm refusal.
const INJECTION = /ignore|override|system|prompt|password|token|api key|ลืมคำสั่ง|ละเลย|ไม่ต้องสน|ไม่สนใจ|คำสั่งก่อน|คำสั่งเดิม|แกล้ง|สมมติ|แฮก/i;
const SCHEDULE_HINT = /จันทร์|อังคาร|พุธ|พฤหัส|ศุกร์|วิชา|ห้อง|กลุ่ม|คาบ|\d{5}\s*-\s*\d{4}|com\s*\d/i;
const OPINION = /ง่าย|ยาก|สนุก|น่าเบื่อ|ใจดี|ดุ|โหด|เก่ง/;
const RUDE =/โง่|ควาย|ปัญญาอ่อน|เหี้ย|สัส|ส้นตีน|fuck|shit|stupid|idiot/i;
const PLAYFUL = [
  [/แฟน|โสด|หล่อ|สวย|น่ารัก|จีบ|ความรัก/, 'เรื่องหัวใจตอบให้ไม่ได้ค่ะ ในตารางสอนมีแต่วิชา วัน และคาบเรียน ถ้าอยากรู้ว่าสอนวันไหน อันนั้นตอบได้ทันทีนะคะ'],
  [/กิน|หิว|อาหาร|ข้าว|ขนม|กาแฟ/, 'เรื่องกินตอบให้ไม่ได้ค่ะ ผู้ช่วยนี้อิ่มแค่ข้อมูลตารางสอน ลองถามว่าวันนี้สอนกี่คาบดูไหมคะ'],
  [OPINION, 'เรื่องความเห็นแบบนี้ตอบให้ไม่ได้ค่ะ ตารางสอนบอกได้แค่วิชา วัน เวลา และจำนวนคาบ ถ้าอยากรู้ว่าวิชาไหนสอนกี่คาบ ถามได้เลยนะคะ'],
  [/\d\s*[+*/x×÷-]\s*\d|บวก|คูณ|หาร|คิดเลข|การบ้าน/, 'โจทย์นี้ตอบให้ไม่ได้ค่ะ เลขที่ถนัดมีแค่จำนวนคาบกับชั่วโมงสอน ลองถามว่าวันจันทร์สอนกี่คาบดูนะคะ'],
  [/เพลง|หนัง|เกม|ดูดวง|หวย|ฟุตบอล|บอล|ละคร/, 'เรื่องบันเทิงตอบให้ไม่ได้ค่ะ ตารางสอนไม่ได้จดไว้ แต่ถ้าถามว่าวิชาไหนเรียนห้องอะไร ตอบได้เลยค่ะ'],
];
const OFF_TOPIC = [
  'อันนี้ตอบให้ไม่ได้ค่ะ เกินหน้าที่ผู้ช่วยตารางสอนไปนิดนึง ถามเรื่องวิชา วัน หรือจำนวนคาบได้เลยนะคะ',
  'ตอบให้ไม่ได้ค่ะ เรื่องนี้ไม่มีในตารางสอน ถ้าเป็นเรื่องสอนวันไหน กี่คาบ วิชาอะไร ตอบได้ทันทีค่ะ',
  'ตอบให้ไม่ได้ค่ะ ผู้ช่วยนี้รู้แค่ตารางสอน ลองถามแบบ "วันนี้สอนอะไร" ดูไหมคะ',
];
const ALIASES = [
  ['เทคโนโลยีการจัดการฐานข้อมูล', 'ฐานข้อมูล', 'database', 'ดาต้าเบส', 'ดาต้าเบต'],
  ['การจัดการข้อมูลขนาดใหญ่เบื้องต้น', 'ข้อมูลขนาดใหญ่', 'บิ๊กดาต้า', 'บิกดาต้า', 'big data', 'bigdata'],
  ['การวิเคราะห์และนำเสนอข้อมูล', 'วิเคราะห์และนำเสนอข้อมูล', 'วิเคราะห์ข้อมูล', 'นำเสนอข้อมูล', 'วิเคราะห์'],
  ['ระบบปฏิบัติการเครื่องแม่ข่ายเบื้องต้น', 'ระบบปฏิบัติการ', 'เครื่องแม่ข่าย', 'แม่ข่าย', 'เซิร์ฟเวอร์', 'server'],
];
// Common English words are mapped to the Thai words the parser understands.
const ENGLISH = [
  [/\bwhat (?:subjects?|courses?|classes)\b/g, 'วิชาอะไร'], [/\bhow many periods?\b/g, 'กี่คาบ'], [/\bhow many hours?\b/g, 'กี่ชั่วโมง'], [/\bhow many (?:subjects?|courses?|classes)\b/g, 'กี่วิชา'],
  [/\bwhat time\b/g, 'กี่โมง'], [/\bwhat day\b|\bwhich days?\b|\bwhen\b/g, 'วันไหน'], [/\bwhich room\b|\bwhere\b/g, 'ห้องไหน'],
  [/\b(?:subjects?|courses?|classes|class)\b/g, 'วิชา'], [/\b(?:schedule|timetable)\b/g, 'ตาราง'], [/\bperiods?\b/g, 'คาบ'], [/\brooms?\b/g, 'ห้อง'],
  [/\bhours?\b/g, 'ชั่วโมง'], [/\bteacher\b/g, 'ครู'], [/\b(?:teach(?:es|ing)?|study|studies|learn)\b/g, 'สอน'], [/\btoday\b/g, 'วันนี้'], [/\btomorrow\b/g, 'พรุ่งนี้'],
  [/\bwhat\b|\bwhich\b/g, 'อะไร'], [/\b(?:do|does|you|i|we|on|for|the|is|are|a|an|in|at|of|please|there|have|has|my)\b/g, ' '],
];

// NFKC splits SARA AM (ำ) into nikhahit + sara aa; recompose it so literal
// patterns such as "ทำ" or "จำนวน" still match normalized text. Emoji are dropped.
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase()
  .replace(/ํา/g, 'ำ')
  .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, ' ')
  .replace(/[๐-๙]/g, digit => String(digit.charCodeAt(0) - 0x0e50)).trim();
const unique = values => [...new Set(values)];
const result = (status, reply, sources = [], suggestions) => ({
  status, reply, sources: sources.filter((source, index, all) => all.findIndex(item => item.path === source.path) === index),
  ...(suggestions ? { suggestions } : {}),
});
const missing = text => result('not_found', `${text} จึงตอบยืนยันไม่ได้ค่ะ`, [], EXAMPLES);
const minutes = text => { const [h, m] = text.split(':').map(Number); return h * 60 + m; };
const duration = row => { const [start, end] = row.time.split('-').map(minutes); return (end - start) / 60; };
function durationInWindows(row, windows) {
  if (!windows.length) return duration(row);
  const [rowStart, rowEnd] = row.time.split('-').map(minutes);
  const intersections = windows.map(([start, end]) => [Math.max(start, rowStart), Math.min(end, rowEnd)])
    .filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const interval of intersections) {
    const previous = merged.at(-1);
    if (previous && interval[0] <= previous[1]) previous[1] = Math.max(previous[1], interval[1]);
    else merged.push([...interval]);
  }
  return merged.reduce((sum, [start, end]) => sum + end - start, 0) / 60;
}
function refusal(message, mixed) {
  const text = normalize(message);
  if (mixed || INJECTION.test(text)) return result('out_of_scope', REFUSAL, [], EXAMPLES);
  if (RUDE.test(text)) return result('out_of_scope', 'ตอบให้ไม่ได้ค่ะ ขอตอบเฉพาะคำถามเกี่ยวกับตารางสอน เช่น วันไหนสอนวิชาอะไร หรือวันหนึ่งสอนกี่คาบ', [], EXAMPLES);
  const playful = PLAYFUL.find(([pattern]) => pattern.test(text));
  if (playful) return result('out_of_scope', playful[1], [], EXAMPLES);
  const index = [...text].reduce((sum, char) => sum + char.codePointAt(0), 0) % OFF_TOPIC.length;
  return result('out_of_scope', OFF_TOPIC[index], [], EXAMPLES);
}

// Greetings, thanks, laughter, and "what can you do" carry no schedule filter.
function smallTalk(message) {
  if (!normalize(message)) return null;
  const core = normalize(message).replace(/ครับผม|ครับ|ค่ะ|คะ|จ้า|จ้ะ|คับ|งับ|นะ|[\s!?.~,]/g, '');
  if (!core || /^(?:ok|okay|โอเค|โอเคร|ได้|ได้เลย|เข้าใจแล้ว|รับทราบ|อืม+|อ๋อ+|โอ้+|เค)$/.test(core)) return result('clarification', 'รับทราบค่ะ มีคำถามเรื่องตารางสอนถามต่อได้เลย เช่น วันนี้สอนกี่คาบ', [], EXAMPLES);
  if (/^(?:งง|ไม่เข้าใจ|อะไร|อะไรนะ|หมายความว่าไง|ช่วยด้วย|ช่วยหน่อย|ใช้ไม่เป็น|ถามยังไง|ถามไง)$/.test(core)) {
    return result('clarification', 'ไม่เป็นไรค่ะ พิมพ์ถามสั้น ๆ ได้เลย เช่น "จันทร์" เพื่อดูตารางวันจันทร์, "สอนวิชาอะไรบ้าง", "วันนี้สอนกี่คาบ" หรือ "คาบละกี่ชั่วโมง"', [], EXAMPLES);
  }
  if (/^(?:เบื่อ|เหนื่อย|ท้อ|เครียด|ง่วง|เรียนไม่ไหว|ไม่ไหว)(?:แล้ว|จัง|มาก|อะ|อ่ะ)*$/.test(core)) {
    return result('clarification', 'เป็นกำลังใจให้นะคะ ถ้าอยากรู้ว่าวันนี้เหลือกี่คาบหรือคาบต่อไปเรียนอะไร ถามได้เลยค่ะ', [], EXAMPLES);
  }
  if (/^(?:สวัสดี|หวัดดี|ดีจ้า|ดี|hello|hi|hey)$/.test(core)) return result('clarification', 'สวัสดีค่ะ ถามเรื่องตารางสอนได้เลย เช่น สอนวิชาอะไรบ้าง สอนวันไหน หรือวันหนึ่งสอนกี่คาบ', [], EXAMPLES);
  if (/^(?:ขอบคุณ(?:มาก)?|ขอบใจ|thx|thanks|thankyou|แต๊งกิ้ว)$/.test(core)) return result('clarification', 'ยินดีค่ะ มีอะไรเกี่ยวกับตารางสอนถามต่อได้เลยนะคะ', [], EXAMPLES);
  if (/^(?:5{3,}|ฮ่า+|(?:ha)+|lol|อิอิ|คิคิ)$/.test(core)) return result('clarification', 'ขำด้วยคนค่ะ แต่ยังไม่มีคำถามเรื่องตารางเลย ลองถามว่าวันนี้สอนกี่คาบดูไหมคะ', [], EXAMPLES);
  if (/^(?:คุณ|เธอ|บอท|นี่)?(?:เป็นใคร|คือใคร|ทำอะไรได้(?:บ้าง)?|ช่วยอะไรได้(?:บ้าง)?|ถามอะไรได้(?:บ้าง)?|ใช้(?:ยังไง|อย่างไร)|help)$/.test(core)) {
    return result('clarification', 'ฉันเป็นผู้ช่วยตารางสอน ตอบได้ว่าสอนวิชาอะไร วันไหน กี่คาบ คาบละกี่ชั่วโมง เรียนห้องไหน และกลุ่มไหน ตามข้อมูลในตารางเท่านั้นค่ะ', [], EXAMPLES);
  }
  return null;
}

const source = (label, path) => ({ label, path });
const courseSource = (course, courses) => source(`รายวิชา ${course.code}`, `courses[${courses.indexOf(course)}]`);

function groupMembers(value) {
  const compact = normalize(value).replace(/\s/g, '').replace(/^([ก-๙]+)(\d)/, '$1.$2');
  const match = compact.match(/^(.*\/)(\d+)-(\d+)$/);
  if (!match) return [compact];
  const start = Number(match[2]); const end = Number(match[3]);
  if (end < start || end - start > 50) return [compact];
  return Array.from({ length: end - start + 1 }, (_, index) => `${match[1]}${start + index}`);
}

function dayFromNow(options, offset) {
  const now = options.now === undefined ? new Date() : new Date(options.now);
  if (Number.isNaN(now.getTime())) return null;
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [year, month, day] = date.split('-').map(Number);
  return DAY_NAMES[new Date(Date.UTC(year, month - 1, day + offset)).getUTCDay()];
}

// Only recognized entities and question words may enter retrieval. Remaining text
// is rejected, including a second request appended to a valid schedule question.
function parse(schedule, input, options, previous) {
  // "อาทิตย์" also means "week"; only an explicit weekday phrase means Sunday.
  // "บ่ายนี้" means this afternoon: today plus an afternoon window.
  // Spoken Thai times become digits: "บ่ายโมง" = 13, "บ่ายสอง" = 14, "หนึ่งทุ่ม" = 19.
  const text = ENGLISH.reduce((value, [pattern, thai]) => value.replace(pattern, ` ${thai} `), normalize(input)).trim().replace(/ทั้งอาทิตย์|ต่ออาทิตย์|อาทิตย์ละ|อาทิตย์นี้|อาทิตย์หน้า|ในอาทิตย์|อาทิตย์นึง|อาทิตย์หนึ่ง/g, 'สัปดาห์')
    .replace(/สัปดาห์(?:นึง|หนึ่ง)/g, 'สัปดาห์')
    .replace(/(เช้า|บ่าย|เย็น)นี้/g, 'วันนี้$1')
    .replace(/(สิบสอง|สิบเอ็ด|สิบ|เก้า|แปด|เจ็ด|หก|ห้า|สี่|สาม|สอง|หนึ่ง|นึง)\s*(?=โมง|ทุ่ม)/g, word => ` ${THAI_NUMBERS[word.trim()]}`)
    .replace(/บ่ายโมง/g, '13 โมง')
    .replace(/บ่าย\s*(สอง|สาม|สี่|ห้า|\d)(?!\d)\s*(?:โมง)?/g, (_, hour) => ` ${12 + (THAI_NUMBERS[hour] ?? Number(hour))} โมง`)
    .replace(/(\d{1,2})\s*ทุ่ม(?:ครึ่ง)?/g, (_, hour) => ` ${18 + Number(hour)} โมง`)
    .replace(/เที่ยงตรง|เที่ยงวัน/g, '12:00')
    // The timetable repeats weekly, so "จันทร์หน้า" is just Monday.
    .replace(/(จันทร์|อังคาร|พุธ|พฤหัส(?:บดี)?|ศุกร์)(?:หน้า|นี้|ที่จะถึง)/g, '$1')
    // "ห้อง 602" and "ห้องคอม 603" name COM rooms; "31901 2007" is a course code.
    .replace(/ห้อง\s*(?:คอม(?:พิวเตอร์)?\s*)?(\d{3})(?!\d)/g, 'ห้อง com$1').replace(/คอม\s*(\d{3})(?!\d)/g, 'com$1')
    .replace(/(?<!\d)(\d{5})\s+(\d{4})(?!\d)/g, '$1-$2').replace(/(?<!\d)(\d{5})(\d{4})(?!\d)/g, '$1-$2');
  let remaining = text;
  const query = { days: [], codes: [], rooms: [], groups: [], windows: [], fields: [], periods: [], relative: false, text };
  const remove = value => { remaining = remaining.split(value).join(' '); };
  if (!text) return { error: 'clarification' };
  if (OUT_OF_SCOPE.test(text)) return { error: 'out_of_scope', mixed: SCHEDULE_HINT.test(text) || /คืออะไร|อธิบาย|ความหมาย/.test(text) };
  // Negation and exclusions change the meaning of a filter. Until supported,
  // ask for a positive condition instead of stripping the operator away.
  if (/(?:ไม่(?!มี(?:สอน|เรียน))|ยกเว้น|นอกจาก|เว้นแต่|นอกเหนือ)/.test(text)) return { error: 'clarification' };
  if (/วันที่\s*\d{1,2}/.test(text)) return { error: 'clarification', detail: 'ตารางนี้เป็นตารางประจำสัปดาห์ ไม่ได้แยกตามวันที่ในปฏิทิน กรุณาถามเป็นวันในสัปดาห์ เช่น วันจันทร์สอนอะไร หรือถามว่าวันนี้สอนอะไรค่ะ' };

  for (const code of text.match(/\d{5}\s*-\s*\d{4}/g) || []) {
    const normalized = code.replace(/\s/g, '');
    query.codes.push(normalized); remove(code);
  }
  // Polite openers and "I want to know that..." wrap the real question.
  for (const phrase of ['อยากทราบว่า', 'อยากรู้ว่า', 'ขอถามหน่อย', 'ขอถามว่า', 'ขอสอบถาม', 'สอบถาม', 'รบกวนถาม', 'รบกวน', 'ช่วยดูให้หน่อย', 'ช่วยดู', 'บอกหน่อยว่า', 'พี่ครับ', 'พี่คะ', 'พี่ค่ะ', 'ครูครับ', 'ครูคะ', 'ครูค่ะ']) remove(phrase);
  for (const course of schedule.courses || []) {
    const aliases = [course.name, ...(ALIASES.find(items => items[0] === course.name)?.slice(1) || [])].map(normalize).sort((a, b) => b.length - a.length);
    for (const alias of aliases) if (remaining.includes(alias)) { query.codes.push(course.code); remove(alias); }
  }
  for (const room of remaining.match(/com\s*\d+|สถานประกอบการ|ออนไลน์/gi) || []) {
    query.rooms.push(room.replace(/\s/g, '')); remove(room);
  }
  // Known prefixes may touch other Thai words ("กลุ่มสท.4/2"); unknown ones must
  // start a word so "จันทร์ 4/2" is not read as group "ทร์4/2".
  const knownGroups = Object.values(schedule.weeklySchedule || {}).flat().flatMap(row => groupMembers(row.group));
  const prefixes = unique(knownGroups.map(group => group.match(/^([ก-๙]+)\./)?.[1]).filter(Boolean));
  const groupPattern = new RegExp(`(?:${[...prefixes, '(?<![ก-๙])[ก-๙]{1,4}'].join('|')})\\s*\\.?\\s*\\d+\\s*\\/\\s*\\d+(?:\\s*-\\s*\\d+)?`, 'g');
  for (const group of remaining.match(groupPattern) || []) {
    query.groups.push(group.replace(/\s/g, '')); remove(group);
  }
  // A bare "4/2" is resolved against the group prefixes that exist in the data.
  for (const match of [...remaining.matchAll(/(?<![\d/:.])(\d{1,2})\s*\/\s*(\d{1,2})(?![\d/])/g)]) {
    const suffix = `${match[1]}/${match[2]}`;
    const candidates = unique(knownGroups.filter(group => group.endsWith(`.${suffix}`)));
    if (candidates.length > 1) return { error: 'clarification', detail: `กลุ่ม ${suffix} มีหลายกลุ่มในตาราง: ${candidates.join(', ')} กรุณาระบุให้ชัดค่ะ` };
    query.groups.push(candidates[0] || suffix); remove(match[0]);
  }
  if (/ปว[ชส]/.test(remaining) && !query.groups.length) {
    return { error: 'not_found', detail: `ตารางนี้ระบุกลุ่มเรียนเป็นรหัส ไม่ได้ระบุระดับ ปวช./ปวส. กลุ่มที่มีคือ ${unique(knownGroups).join(', ')}` };
  }
  // "Now" and "next class" read the current Bangkok time against today's rows.
  if (/ตอนนี้|ขณะนี้|เดี๋ยวนี้|คาบนี้/.test(remaining)) query.nowMode = 'now';
  if (/คาบ(?:ต่อไป|ถัดไป|หน้า)|วิชา(?:ต่อไป|ถัดไป)|ต่อไป(?:เรียน|สอน)|ถัดไป(?:เรียน|สอน)/.test(remaining)) query.nowMode = 'next';
  if (query.nowMode) {
    for (const word of ['ตอนนี้', 'ขณะนี้', 'เดี๋ยวนี้', 'คาบนี้', 'คาบต่อไป', 'คาบถัดไป', 'คาบหน้า', 'วิชาต่อไป', 'วิชาถัดไป', 'ต่อไป', 'ถัดไป', 'อยู่']) remove(word);
    if (!/จันทร์|อังคาร|พุธ|พฤหัส|ศุกร์|เสาร์|อาทิตย์|พรุ่งนี้|เมื่อวาน/.test(remaining)) {
      const day = dayFromNow(options, 0);
      if (!day || bangkokMinutes(options) === null) return { error: 'clarification' };
      query.days.push(day); query.relative = true;
    }
  }
  const relatives =[['มะรืนนี้', 2], ['เมื่อวานซืน', -2], ['พรุ่งนี้', 1], ['เมื่อวาน', -1], ['วันนี้', 0]];
  for (const [word, offset] of relatives) if (remaining.includes(word)) {
    const day = dayFromNow(options, offset);
    if (!day) return { error: 'clarification' };
    query.days.push(day); query.relative = true; remove(word);
  }
  const dayAliases = DAY_NAMES.map(day => [day, day]);
  // Common misspellings and English names come after the exact Thai names.
  dayAliases.push(['พฤหัส', 'พฤหัสบดี'], ['พฤหัด', 'พฤหัสบดี'], ['พหัส', 'พฤหัสบดี'], ['จันท', 'จันทร์'], ['จัน', 'จันทร์'], ['อังคาน', 'อังคาร'], ['อังคา', 'อังคาร'], ['พุท', 'พุธ'], ['ศุข', 'ศุกร์'], ['ศุก', 'ศุกร์'],
    ['monday', 'จันทร์'], ['tuesday', 'อังคาร'], ['wednesday', 'พุธ'], ['thursday', 'พฤหัสบดี'], ['friday', 'ศุกร์'], ['saturday', 'เสาร์'], ['sunday', 'อาทิตย์']);
  for (const [word, day] of dayAliases) if (remaining.includes(word)) { query.days.push(day); remove(`วัน${word}`); remove(word); }
  // A day range is expanded only when both endpoints are explicit weekdays.
  const dayRange = text.match(/(?:วัน)?(จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์)\s*(?:ถึง|-)\s*(?:วัน)?(จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์)/);
  if (dayRange) {
    const first = DAY_NAMES.indexOf(dayRange[1]); const last = DAY_NAMES.indexOf(dayRange[2]);
    query.days = Array.from({ length: (last - first + 7) % 7 + 1 }, (_, index) => DAY_NAMES[(first + index) % 7]);
  }

  for (const match of [...remaining.matchAll(/คาบ(?:ที่)?\s*(\d+)(?:\s*(?:ถึง|-)\s*(\d+))?/g)]) {
    const start = Number(match[1]); const end = Number(match[2] || start);
    if (end < start || end - start > 24) return { error: 'clarification' };
    for (let value = start; value <= end; value++) {
      const period = (schedule.periods || []).find(item => item.period === value);
      if (!period) return { error: 'not_found', detail: `ไม่พบคาบที่ ${value} ในข้อมูล` };
      query.windows.push(period.time.split('-').map(minutes));
      query.periods.push(period);
    }
    query.period = true; remove(match[0]);
  }
  for (const match of [...remaining.matchAll(/\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s*(?:-|ถึง)\s*([01]?\d|2[0-3])[:.]([0-5]\d))?/g)]) {
    const start = Number(match[1]) * 60 + Number(match[2]);
    const end = match[3] === undefined ? start + 1 : Number(match[3]) * 60 + Number(match[4]);
    if (end <= start) return { error: 'clarification' };
    const modifier = remaining.slice(0, match.index).match(/(ก่อน|หลัง|ตั้งแต่)\s*$/)?.[1];
    query.windows.push(modifier === 'ก่อน' ? [0, start] : modifier && match[3] === undefined ? [start, 1440] : [start, end]); remove(match[0]);
  }
  for (const match of [...remaining.matchAll(/(?:เวลา\s*)?(\d{1,2})\s*(?:นาฬิกา|โมง)(?:เช้า|เย็น)?/g)]) {
    let hour = Number(match[1]);
    // In spoken Thai "สี่โมง" without "เช้า" is 16:00; teaching starts at 08:00.
    if ((match[0].includes('เย็น') && hour < 12) || (hour >= 1 && hour <= 6 && !match[0].includes('เช้า'))) hour += 12;
    if (hour > 23) return { error: 'clarification' };
    const modifier = remaining.slice(0, match.index).match(/(ก่อน|หลัง|ตั้งแต่)\s*$/)?.[1];
    query.windows.push(modifier === 'ก่อน' ? [0, hour * 60] : modifier ? [hour * 60, 1440] : [hour * 60, hour * 60 + 1]); remove(match[0]);
  }
  for (const [word, window] of [['ช่วงเช้า', [0, 720]], ['ตอนเช้า', [0, 720]], ['ช่วงบ่าย', [720, 960]], ['ตอนบ่าย', [720, 960]], ['ช่วงเย็น', [960, 1440]], ['ตอนเย็น', [960, 1440]],
    ['หลังเที่ยง', [720, 1440]], ['ก่อนเที่ยง', [0, 720]], ['ตอนเที่ยง', [720, 780]], ['เที่ยง', [720, 780]], ['เช้า', [0, 720]], ['บ่าย', [720, 960]], ['เย็น', [960, 1440]], ['ค่ำ', [1080, 1440]]]) {
    if (remaining.includes(word)) { query.windows.push(window); remove(word); }
  }

  const fields = [['credit', /หน่วยกิต|credit/], ['theory', /ทฤษฎี/], ['practice', /ปฏิบัติ/], ['hours', /ชั่วโมง|ภาระงาน/]];
  query.fields = fields.filter(([, pattern]) => pattern.test(remaining)).map(([field]) => field);
  query.scheduleIntent = /วันไหน|วันอะไร|เรียนวัน|สอนวัน|กี่โมง|เวลาไหน|ห้องไหน|ห้องอะไร|ที่ไหน|ช่วงไหน|คาบ|ตาราง/.test(text);
  query.students = /นักเรียน|ผู้เรียน|กี่คน/.test(remaining);
  query.courseCount = /กี่วิชา|จำนวนวิชา/.test(remaining);
  query.total = /รวม|ทั้งหมด|สัปดาห์(?!ที่)|ทุกวิชา/.test(remaining);
  query.catalog = /รายวิชา|วิชาอะไร|กี่วิชา|จำนวนวิชา|ชื่อวิชา/.test(remaining) && !/สอน|เรียน|วัน|ห้อง|เวลา|กลุ่ม|คาบ/.test(remaining);
  query.periodCount = /กี่คาบ|จำนวนคาบ|มีคาบ(?:สอน|เรียน)?(?:เท่าไ|กี่)/.test(remaining);
  query.periodList = /คาบ/.test(remaining) && !query.period && !query.periodCount && /เวลา|กี่โมง|ทั้งหมด|ตารางคาบ/.test(remaining);
  query.perDay = /วันนึง|วันหนึ่ง|ต่อวัน|แต่ละวัน|วันละ|รายวัน/.test(remaining);
  query.daySummary = /วันไหน|วันอะไร|กี่วัน|วันใดบ้าง/.test(remaining);
  query.courseSummary = /วิชาอะไร|วิชาไหน|วิชาไร|กี่วิชา|มีวิชา/.test(remaining);
  query.firstLast = /คาบแรก|วิชาแรก/.test(remaining) ? 'first' : /คาบสุดท้าย|วิชาสุดท้าย|คาบท้าย/.test(remaining) ? 'last' : null;
  query.startEnd = !query.firstLast && /เริ่ม(?:สอน|เรียน)?กี่โมง|เข้า(?:สอน|เรียน)?กี่โมง|เลิก(?:สอน|เรียน)?กี่โมง|เสร็จกี่โมง|ถึงกี่โมง|(?:สอน|เรียน)ถึง/.test(remaining);
  if (query.firstLast) query.periodList = false;
  query.consecutive = /ติดกัน|ต่อเนื่อง|ติดๆ|ติด ๆ/.test(remaining);
  query.superlative = /(?:เยอะ|มาก|หนัก|บ่อย)(?:ที่)?สุด/.test(remaining) ? 'max' : /(?:น้อย|เบา)(?:ที่)?สุด/.test(remaining) ? 'min' : null;
  query.roomSummary = !query.rooms.length && /ห้อง(?:เรียน)?(?:ไหน|อะไร)(?:บ้าง|มั่ง)|กี่ห้อง|ใช้ห้อง(?:ไหน|อะไร)/.test(remaining);
  query.groupSummary = !query.groups.length && /กลุ่ม(?:เรียน)?(?:ไหน|อะไร)(?:บ้าง|มั่ง)|กี่กลุ่ม|มีกลุ่ม/.test(remaining);
  query.unavailable = /ว่าง|หยุด|ยกเลิก|สอบ|ชดเชย|โทร|เบอร์|อีเมล|โรงเรียน|สถานศึกษา|วิทยาลัย|เงินเดือน|อายุ|ที่อยู่|พัก|ไม่มี(?:สอน|เรียน)|ขอลา|ลาป่วย|ลากิจ|ครู(?:อยู่|นั่ง)/.test(remaining);
  query.meta = [
    ['teacher', 'ผู้สอน', /ครูชื่อ|ชื่อครู|ใครสอน|ใครเป็น|ชื่อผู้สอน|ผู้สอนชื่อ|อาจารย์ชื่อ|ชื่ออาจารย์|ตาราง.*ของใคร|ครูคนไหน/],
    ['semester', 'ภาคเรียน', /ภาคเรียน|เทอม/], ['department', 'แผนก', /แผนก|สาขา/],
    ['qualification', 'วุฒิการศึกษา', /วุฒิ|การศึกษา|จบอะไร|จบจาก|เรียนจบ/], ['role', 'ตำแหน่งหน้าที่', /ตำแหน่ง|หน้าที่/],
    ['weekRange', 'ช่วงสัปดาห์', /สัปดาห์ที่|กี่สัปดาห์|ช่วงสัปดาห์|สัปดาห์ไหน|ใช้สัปดาห์/], ['note', 'หมายเหตุ', /หมายเหตุ|ข้อควรระวัง|ที่มาข้อมูล|ความถูกต้อง/],
  ].filter(([, , pattern]) => pattern.test(remaining)).map(([key, label]) => [key, label]);
  if (/ครู|ผู้สอน|อาจารย์/.test(remaining) && /ชื่ออะไร|ชื่อว่า|เป็นใคร/.test(remaining) && !query.meta.some(([key]) => key === 'teacher')) query.meta.push(['teacher', 'ผู้สอน']);
  const teacher = normalize(schedule.meta?.teacher);
  if (teacher) { remove(teacher); remove(teacher.replace(/^(นาย|นางสาว|นาง)/, '')); remove(firstName(teacher)); }
  const hasExplicitEntities = ['days', 'codes', 'rooms', 'groups', 'windows'].some(key => query[key].length);
  const followup = /^(?:แล้ว|และ|ส่วน|วิชาเดิม|วันเดิม|ห้องเดิม|กลุ่มเดิม|อันเดิม|ที่ไหน|กี่โมง|กี่คน|กี่หน่วยกิต|กี่ชั่วโมง)/.test(text)
    // A bare "กี่คาบ" continues a previous question, or asks about the whole week.
    || (Boolean(previous) && /^(?:กี่คาบ|กี่วัน)/.test(text)) || (!hasExplicitEntities && !query.roomSummary && !query.superlative && !query.unavailable &&/ห้อง(?:อะไร|ไหน)|เริ่มกี่โมง|เรียนที่ไหน/.test(text));

  // Remove longest phrases first; never silently remove arbitrary nouns or numbers.
  const vocabulary = [
    'วันไหนบ้าง', 'ช่วงสัปดาห์', 'สัปดาห์ที่', 'กี่สัปดาห์', 'ข้อควรระวัง', 'ที่มาข้อมูล', 'ความถูกต้อง', 'วุฒิการศึกษา', 'การศึกษา', 'ชื่อผู้สอน', 'ผู้สอนชื่อ', 'อาจารย์ชื่อ', 'ชื่ออาจารย์', 'ตำแหน่งหน้าที่',
    'ทั้งสัปดาห์', 'ตารางคาบ', 'ตารางสอน', 'ตารางเรียน', 'รายละเอียด', 'จำนวนวิชา', 'จำนวนนักเรียน', 'จำนวนผู้เรียน', 'หน่วยกิต', 'ชั่วโมง', 'ภาระงาน', 'ทฤษฎี', 'ปฏิบัติ', 'รายวิชา', 'สถานศึกษา', 'วิทยาลัย', 'โรงเรียน', 'เงินเดือน', 'อีเมล',
    'วิชาเดิม', 'วันเดิม', 'ห้องเดิม', 'กลุ่มเดิม', 'อันเดิม', 'เรียนที่ไหน', 'วันไหน', 'เวลาไหน', 'ห้องไหน', 'ห้องอะไร', 'กี่โมง', 'เมื่อไหร่', 'เมื่อไร', 'เท่าไหร่', 'เท่าไร', 'จำนวน', 'นักเรียน', 'ผู้เรียน', 'ใครเป็น', 'ใครสอน', 'ครูชื่อ', 'ชื่อครู', 'ชื่ออะไร', 'ชื่อว่า', 'เป็นใคร',
    'บอกหน่อย', 'ช่วยบอก', 'ขอดู', 'อยากรู้', 'ขอทราบ', 'สวัสดี', 'ขอบคุณ', 'วันนี้', 'พรุ่งนี้', 'สัปดาห์นี้', 'แต่ละ', 'ทั้งหมด', 'ทุกวิชา', 'ทุกวัน', 'อะไรบ้าง', 'บ้างไหม', 'ใช่ไหม', 'หรือเปล่า', 'มีไหม', 'มีมั้ย', 'ยังไง', 'อย่างไร',
    'ภาคเรียน', 'แผนก', 'สาขา', 'วุฒิ', 'ตำแหน่ง', 'หน้าที่', 'หมายเหตุ', 'ตาราง', 'ข้อมูล', 'ผู้สอน', 'อาจารย์', 'สัปดาห์', 'ยกเลิก', 'ชดเชย', 'โทรศัพท์', 'ที่อยู่', 'เบอร์', 'เริ่ม', 'สิ้นสุด', 'เลิก',
    'credit', 'เทอม', 'ช่วง', 'ตั้งแต่', 'ก่อน', 'หลัง', 'ตอน', 'เวลา', 'วิชา', 'รหัส', 'ห้อง', 'กลุ่ม', 'ชั้น', 'เรียน', 'สอน', 'คาบ', 'กี่', 'คน', 'รวม', 'ครู', 'ชื่อ', 'อะไร', 'ไหน', 'ไหม', 'มั้ย', 'บ้าง', 'ว่าง', 'หยุด', 'สอบ', 'พัก', 'อายุ', 'โทร', 'สรุป', 'ใคร',
    'ครับ', 'ค่ะ', 'คะ', 'นะ', 'หน่อย', 'ด้วย', 'แล้ว', 'ล่ะ', 'ละ', 'และ', 'กับ', 'หรือ', 'ส่วน', 'ของ', 'ใน', 'จาก', 'ตาม', 'สำหรับ', 'เป็น', 'ได้', 'ให้', 'ขอ', 'มี', 'ไม่', 'วัน', 'ถึง', 'ที่', 'น.',
    // Per-day, period, start/end, and casual/misspelled question words.
    'วันนึง', 'วันหนึ่ง', 'ต่อวัน', 'แต่ละวัน', 'วันละ', 'รายวัน', 'กี่วัน', 'วันใด', 'ต่อสัปดาห์', 'สัปดาห์ละ', 'จำนวนคาบ', 'คาบแรก', 'คาบสุดท้าย', 'เข้า', 'เสร็จ',
    'เยอะที่สุด', 'มากที่สุด', 'หนักที่สุด', 'บ่อยที่สุด', 'น้อยที่สุด', 'เบาที่สุด', 'ที่สุด', 'สุด', 'เยอะ', 'มาก', 'หนัก', 'บ่อย', 'น้อย', 'เบา',
    'อยากทราบ', 'ขอลาหยุด', 'ขอลา', 'ลาป่วย', 'ลากิจ', 'ต้อง', 'อยู่', 'พี่', 'หนู', 'ผม', 'ฉัน', 'เรา', 'ดิฉัน', 'ว่า',
    'คาบท้าย', 'วิชาแรก', 'วิชาสุดท้าย', 'ติดกัน', 'ต่อเนื่อง', 'ติดๆ', 'ติด ๆ', 'จบ', 'มา', 'คนนี้', 'นี้', 'ใช้', 'ไป', 'ต่อ', 'ห้องเรียน', 'กลุ่มเรียน',
    'ครับผม', 'อาจาร์ย', 'อาจารย', 'อ.', 'มั่ง', 'ไร', 'ป่าว', 'เปล่า', 'อ่ะ', 'อะ', 'จ้า', 'จ้ะ', 'คับ', 'งับ', 'ฮะ', 'เหรอ', 'หรอ', 'มั๊ย', 'เลย', 'ทั้ง', 'ใด', 'ประจำ', 'แบบ',
  ].sort((a, b) => b.length - a.length);
  for (const word of vocabulary) remove(word);
  const residue = remaining.replace(/[\s?!？!.,:;()\[\]"'“”‘’\-–—/]/g, '');
  if (residue) {
    if (OPINION.test(residue)) return { error: 'out_of_scope', mixed: hasExplicitEntities };
    if (/วิชา|รหัส/.test(text) && !query.codes.length && !hasExplicitEntities) return { error: 'not_found', detail: 'ไม่พบวิชาหรือรหัสวิชาที่ระบุในข้อมูล' };
    if (/ห้อง|กลุ่ม/.test(text) && !query.rooms.length && !query.groups.length && !hasExplicitEntities) return { error: 'not_found', detail: 'ไม่พบห้องหรือกลุ่มเรียนที่ระบุในข้อมูล' };
    return { error: 'out_of_scope', mixed: hasExplicitEntities || query.fields.length > 0 };
  }
  // These shapes require intersections or paired clauses, not the simple union
  // of filters below. Clarify instead of widening the requested conditions.
  const temporalModifiers = text.match(/(?:ก่อน|หลัง|ตั้งแต่)\s*\d{1,2}(?:[:.][0-5]\d|\s*(?:โมง|นาฬิกา))/g) || [];
  if (temporalModifiers.length > 1) return { error: 'clarification', detail: 'กรุณาระบุช่วงเวลาเป็นรูปแบบ 09:00-14:00 เพื่อให้คำนวณช่วงเวลาที่ถามได้ชัดเจนค่ะ' };
  if (/\d{1,2}\s*(?:โมง|นาฬิกา)(?:เช้า|เย็น)?\s*(?:ถึง|-)\s*\d{1,2}\s*(?:โมง|นาฬิกา)/.test(text)) return { error: 'clarification', detail: 'กรุณาระบุช่วงเวลาเป็นรูปแบบ 09:00-14:00 เพื่อให้คำนวณช่วงเวลาที่ถามได้ชัดเจนค่ะ' };
  const scopedDayClauses = text.split(/และ|ส่วน|แล้ว|;|\n/).filter(clause =>
    /จันทร์|อังคาร|พุธ|พฤหัส|ศุกร์|เสาร์|อาทิตย์|วันนี้|พรุ่งนี้|เมื่อวาน|มะรืน/.test(clause)
    && /ห้อง|กลุ่ม|วิชา|รหัส|com\s*\d|(?:สท|คภ)\s*\.?\s*\d|\d{5}\s*-\s*\d{4}/.test(clause));
  if (scopedDayClauses.length > 1) return { error: 'clarification', detail: 'กรุณาแยกถามทีละวัน เมื่อแต่ละวันระบุห้อง กลุ่ม หรือวิชาต่างกัน เพื่อไม่ให้สับสนว่าเงื่อนไขใดใช้กับวันไหนค่ะ' };
  if (/(?:ก่อน|หลัง|ตั้งแต่)/.test(text) && !query.windows.length) return { error: 'clarification' };
  if (followup && previous) {
    for (const key of ['days', 'codes', 'rooms', 'groups', 'windows']) if (!query[key].length) query[key] = [...previous[key]];
    if (!query.fields.length && /(?:แล้ว|ส่วน).*(?:วัน|ห้อง|กลุ่ม)/.test(text)) query.fields = [...previous.fields];
  }
  for (const key of ['days', 'codes', 'rooms', 'groups']) query[key] = unique(query[key]);
  const hasSubject = ['days', 'codes', 'rooms', 'groups', 'windows', 'fields', 'meta'].some(key => query[key].length) || query.catalog || query.total || query.periodList || query.periodCount || query.daySummary || query.courseSummary || query.startEnd || query.firstLast || query.consecutive || query.superlative || query.roomSummary || query.groupSummary || query.nowMode || query.unavailable || /ตาราง|สอน|เรียน|รายวิชา|วิชาอะไร/.test(text);
  if (!hasSubject || (followup && !previous && !hasExplicitEntities && !query.meta.length)) return { error: 'clarification' };
  return query;
}

// The OCR teacher directory is a different semester with no reliable day/time
// slots, so it answers only who teaches what, never when or where.
const DIRECTORY_WORDS = [
  'วันไหนบ้าง', 'ภาคเรียน', 'การศึกษา', 'ตำแหน่ง', 'รายชื่อ', 'ทั้งหมด', 'อะไรบ้าง', 'รายวิชา', 'หน้าที่', 'อาจารย์', 'ผู้สอน', 'ข้อมูล', 'ตาราง',
  'กี่โมง', 'วันไหน', 'ห้องไหน', 'เวลา', 'สาขา', 'แผนก', 'วุฒิ', 'เทอม', 'สอน', 'เรียน', 'วิชา', 'รหัส', 'อะไร', 'บ้าง', 'ใคร', 'คนไหน', 'ไหน', 'ครู', 'ชื่อ',
  'ห้อง', 'วัน', 'คาบ', 'กี่', 'คน', 'มี', 'ของ', 'คือ', 'เป็น', 'ที่', 'ใน', 'ขอ', 'ดู', 'บอก', 'หน่อย', 'ช่วย', 'ไหม', 'มั้ย', 'ครับ', 'ค่ะ', 'คะ', 'นะ', 'บ้าง', 'แล้ว', 'ส่วน',
].sort((a, b) => b.length - a.length);
const DIRECTORY_NOTE = 'ข้อมูลนี้มาจากตารางสอนภาคเรียน 1/2568 ที่ถอดด้วย OCR อาจคลาดเคลื่อน และไม่มีข้อมูลวัน เวลา หรือห้องเรียน';
const firstName = name => normalize(name).replace(/^(?:นางสาว|นาย|นาง|น\.ส\.)\s*/, '').split(/[\s(]/)[0];
const directoryCourseLine = course => `${course.code || 'ไม่ทราบรหัส'} — ${course.name || 'ไม่ทราบชื่อวิชา'}${course.confidence === 'low' ? ' (อ่านจาก OCR ไม่ชัด ต้องตรวจสอบ)' : ''}`;

function answerDirectory(schedule, message) {
  const directory = schedule.ocrTeacherDirectory;
  const teachers = Array.isArray(directory?.teachers) ? directory.teachers : [];
  const text = normalize(message);
  if (!teachers.length || !text || OUT_OF_SCOPE.test(text) || /(?:ไม่(?!มี(?:สอน|เรียน))|ยกเว้น|นอกจาก|เว้นแต่|นอกเหนือ)/.test(text)) return null;
  let remaining = text;
  const remove = value => { if (value) remaining = remaining.split(value).join(' '); };
  const residue = () => {
    for (const word of DIRECTORY_WORDS) remove(word);
    return remaining.replace(/[\s?!？.,:;()\[\]"'“”‘’\-–—/]/g, '');
  };
  const teacherPath = teacher => `ocrTeacherDirectory.teachers[${teachers.indexOf(teacher)}]`;
  const mainTeacher = firstName(schedule.meta?.teacher);
  const scheduleIntent = /วันไหน|วันอะไร|กี่โมง|เวลา|ห้อง|คาบ|ตาราง/.test(text);

  // The main schedule's teacher keeps the existing weekly-schedule answers.
  const named = teachers.filter(teacher => { const first = firstName(teacher.name); return first.length > 2 && first !== mainTeacher && text.includes(first); });
  if (named.length) {
    for (const teacher of named) { remove(normalize(teacher.name)); remove(firstName(teacher.name)); }
    for (const code of text.match(/\d{5}\s*-\s*\d{4}/g) || []) remove(code);
    if (residue()) return refusal(message, false);
    const sources = named.map(teacher => source(`รายชื่อครู (OCR): ${teacher.name}`, teacherPath(teacher)));
    if (scheduleIntent) return result('not_found', `ไม่มีข้อมูลวัน เวลา หรือห้องเรียนของ${named.map(teacher => teacher.name).join(', ')} ในระบบ จึงตอบยืนยันไม่ได้ค่ะ\n${DIRECTORY_NOTE}`, sources, EXAMPLES);
    const blocks = named.map(teacher => [
      teacher.name,
      teacher.role && `ตำแหน่งหน้าที่: ${teacher.role}`,
      teacher.qualification && `วุฒิการศึกษา: ${teacher.qualification}`,
      teacher.program && `สาขา: ${teacher.program}`,
      `รายวิชาที่สอน:\n${(teacher.courses || []).map(directoryCourseLine).join('\n')}`,
    ].filter(Boolean).join('\n'));
    return result('answered', `${blocks.join('\n\n')}\n\n${DIRECTORY_NOTE}`, sources);
  }

  if (/รายชื่อครู|ครูทั้งหมด|ครูกี่คน|ครูในแผนก|ครูมีใครบ้าง|ครูคนอื่น/.test(text)) {
    if (residue()) return null;
    return result('answered', `มีรายชื่อครู ${teachers.length} คน\n${teachers.map(teacher => `${teacher.name}${teacher.role ? ` — ${teacher.role}` : ''}`).join('\n')}\n\n${DIRECTORY_NOTE}`,
      teachers.map(teacher => source(`รายชื่อครู (OCR): ${teacher.name}`, teacherPath(teacher))));
  }

  // Codes or names absent from the main course list may still be in the directory.
  const mainCodes = new Set((schedule.courses || []).map(course => course.code));
  const mainNames = (schedule.courses || []).map(course => normalize(course.name));
  const matches = [];
  for (const code of unique((text.match(/\d{5}\s*-\s*\d{4}/g) || []).map(code => code.replace(/\s/g, '')))) {
    if (mainCodes.has(code)) return null;
    matches.push(course => course.code === code); remove(code);
  }
  if (!matches.length && /ใคร|ครูคนไหน|ผู้สอน|อาจารย์คนไหน/.test(text)) {
    // A partial name such as "การสร้างเกม" matches "การสร้างเกมคอมพิวเตอร์".
    const core = text.replace(/ใครสอน|ใคร|ครูคนไหน|อาจารย์คนไหน|ผู้สอน|สอน|วิชา|บ้าง|อะไร|ครับ|ค่ะ|คะ|ไหม|มั้ย|[\s?!.]/g, '');
    const names = unique(teachers.flatMap(teacher => (teacher.courses || []).map(course => course.name)).filter(name => name && !name.includes('…')).map(normalize))
      .filter(name => name.length > 5 && (text.includes(name) || (core.length >= 5 && name.includes(core))) && !mainNames.some(main => main.includes(name) || name.includes(main))).sort((a, b) => b.length - a.length);
    if (names.length && !names.some(name => text.includes(name))) remove(core);
    for (const name of names) { matches.push(course => normalize(course.name) === name); remove(name); }
  }
  if (!matches.length || residue()) return null;
  const lines = []; const sources = [];
  for (const match of matches) {
    for (const teacher of teachers) {
      (teacher.courses || []).forEach((course, index) => {
        if (!match(course)) return;
        lines.push(`${directoryCourseLine(course)}: ${teacher.name}`);
        sources.push(source(`รายชื่อครู (OCR): ${teacher.name}`, `${teacherPath(teacher)}.courses[${index}]`));
      });
    }
  }
  if (!lines.length) return null;
  return result(scheduleIntent ? 'not_found' : 'answered', `${scheduleIntent ? 'ไม่มีข้อมูลวัน เวลา หรือห้องเรียนของวิชานี้ แต่พบผู้สอนดังนี้\n' : ''}${unique(lines).join('\n')}\n\n${DIRECTORY_NOTE}`, sources);
}

const WEEK_ORDER = [...DAY_NAMES.slice(1), DAY_NAMES[0]];
function bangkokMinutes(options) {
  const now = options.now === undefined ? new Date() : new Date(options.now);
  if (Number.isNaN(now.getTime())) return null;
  const [hour, minute] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now).split(':').map(Number);
  return hour * 60 + minute;
}
const clock = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const round = value => Number(value.toFixed(2));
// Periods fully inside a row's time range; misaligned rows count zero periods.
function periodsOf(row, periods) {
  const [start, end] = row.time.split('-').map(minutes);
  return periods.filter(period => { const [periodStart, periodEnd] = period.time.split('-').map(minutes); return periodStart >= start && periodEnd <= end; });
}
const periodLabel = list => !list.length ? '' : list.length === 1 ? `คาบที่ ${list[0].period}` : `คาบที่ ${list[0].period}-${list.at(-1).period}`;

const PERIOD_LENGTH = /คาบ\s*(?:ละ|นึง|หนึ่ง)|(?:หนึ่ง|1|นึง)\s*คาบ|แต่ละคาบ|คาบ(?:เรียน|สอน)?\s*(?:ยาว|นาน)/;
const PERIOD_LENGTH_WORDS = ['เท่าไหร่', 'เท่าไร', 'แค่ไหน', 'ประมาณ', 'ชั่วโมง', 'แต่ละ', 'หนึ่ง', 'เรียน', 'นาที', 'เวลา', 'ครับ', 'คาบ', 'สอน', 'ละ', 'นึง', 'กี่', 'ชม.', 'ชม', 'ยาว', 'นาน', 'มี', 'ใช้', 'ค่ะ', 'คะ', 'นะ', 'อ่ะ', 'อะ', 'หรอ', 'เหรอ', 'ล่ะ', 'วัน', ...DAY_NAMES, '1']
  .sort((a, b) => b.length - a.length);

function answerPeriodLength(schedule, message) {
  const text = normalize(message);
  if (!PERIOD_LENGTH.test(text) || !/กี่|นาน|ยาว|เท่า/.test(text) || OUT_OF_SCOPE.test(text)) return null;
  let remaining = text;
  for (const word of PERIOD_LENGTH_WORDS) remaining = remaining.split(word).join(' ');
  if (remaining.replace(/[\s?!？.,:;()"'-]/g, '')) return null;
  const periods = schedule.periods || [];
  if (!periods.length) return missing('ไม่พบข้อมูลเวลาประจำคาบ');
  const lengths = unique(periods.map(period => { const [start, end] = period.time.split('-').map(minutes); return end - start; }));
  const first = periods[0].time.split('-')[0]; const last = periods.at(-1).time.split('-')[1];
  const lines = [lengths.length === 1
    ? `คาบละ ${round(lengths[0] / 60)} ชั่วโมง (${lengths[0]} นาที) เท่ากันทุกคาบ`
    : `แต่ละคาบยาวไม่เท่ากัน:\n${periods.map(period => `คาบที่ ${period.period}: ${period.time} น.`).join('\n')}`];
  lines.push(`ตารางแบ่งเวลาเป็น ${periods.length} คาบ ตั้งแต่ ${first} ถึง ${last} น.`);
  const rows = Object.entries(schedule.weeklySchedule || {}).flatMap(([day, list]) => list.map(row => ({ ...row, day })));
  const longest = rows.map(row => [row, periodsOf(row, periods).length]).sort((a, b) => b[1] - a[1])[0];
  if (longest && longest[1] > 1) lines.push(`บางรายการสอนต่อเนื่องหลายคาบ เช่น วัน${longest[0].day} ${longest[0].time} น. = ${longest[1]} คาบ`);
  return result('answered', lines.join('\n'), [source('เวลาประจำคาบ', 'periods')]);
}

/** Answer exclusively from the supplied schedule. History assistant text is never read. */
export function answerQuestion(schedule, message, history = [], options = {}) {
  if (!schedule || typeof schedule !== 'object') return missing('ยังไม่มีข้อมูลตารางสอน');
  let previous;
  for (const item of (Array.isArray(history) ? history : []).slice(-12)) {
    if (item?.role !== 'user') continue;
    const text = typeof item.text === 'string' ? item.text : item.content;
    if (typeof text !== 'string') continue;
    const parsed = parse(schedule, text.slice(0, 2000), options, previous);
    previous = parsed.error ? undefined : parsed;
  }
  const text = typeof message === 'string' ? message : '';
  const early = smallTalk(text) || answerPeriodLength(schedule, text) || answerDirectory(schedule, text);
  if (early) return early;
  const query = parse(schedule, text, options, previous);
  if (query.error === 'out_of_scope') return refusal(text, query.mixed);
  if (query.error === 'not_found') return missing(query.detail);
  if (query.error) return result('clarification', query.detail || 'กรุณาระบุวัน ชื่อหรือรหัสวิชา ห้อง หรือกลุ่มเรียนที่ต้องการถามค่ะ', [], EXAMPLES);
  const courses = schedule.courses || [];
  const allRows = Object.entries(schedule.weeklySchedule || {}).flatMap(([day, rows]) => rows.map((row, index) => ({ ...row, day, path: `weeklySchedule.${day}[${index}]` })));
  const unknownCode = query.codes.find(code => !courses.some(course => course.code === code));
  if (unknownCode) return missing(`ไม่พบรหัสวิชา ${unknownCode} ในข้อมูล`);
  const unknownRoom = query.rooms.find(room => !allRows.some(row => normalize(row.room).replace(/\s/g, '') === room));
  if (unknownRoom) return missing(`ไม่พบห้อง ${unknownRoom.toUpperCase()} ในข้อมูล`);
  const unknownGroup = query.groups.find(group => !groupMembers(group).every(member => allRows.some(row => groupMembers(row.group).includes(member))));
  if (unknownGroup) return missing(`ไม่พบกลุ่ม ${unknownGroup} ในข้อมูล`);
  // "Which day is free" lists weekdays without rows; free periods stay unconfirmed.
  if (query.unavailable && query.daySummary && !query.days.length && /ว่าง|ไม่มี(?:สอน|เรียน)/.test(query.text) && !/หยุด|สอบ|ยกเลิก|ชดเชย/.test(query.text)) {
    const weekdays = WEEK_ORDER.slice(0, 5);
    const taught = weekdays.filter(day => allRows.some(row => row.day === day));
    const free = weekdays.filter(day => !taught.includes(day));
    const lead = free.length ? `วันที่ไม่มีรายการสอนในตาราง: ${free.map(day => `วัน${day}`).join(', ')}` : `ตารางมีรายการสอนทุกวันจันทร์–ศุกร์ จึงไม่มีวันไหนว่างทั้งวันค่ะ`;
    return result('answered', `${lead}\nไม่มีข้อมูลวันเสาร์–อาทิตย์ และตารางอาจบันทึกคาบไม่ครบ จึงยืนยันเวลาว่างรายคาบไม่ได้`, taught.map(day => source(`ตารางวัน${day}`, `weeklySchedule.${day}`)));
  }
  if (query.unavailable) return missing('ข้อมูลตารางนี้ไม่ระบุข้อมูลที่ขอ เช่น วันหยุด การสอบ การยกเลิก เวลาว่างที่ยืนยันได้ หรือข้อมูลติดต่อ');
  const absentDay = query.days.find(day => !Object.hasOwn(schedule.weeklySchedule || {}, day));
  if (absentDay) return missing(`ไม่พบข้อมูลวัน${absentDay} ในตาราง จึงไม่สามารถสรุปว่าไม่มีเรียนหรือไม่มีสอนได้`);

  const hasRowFilters = query.days.length || query.rooms.length || query.groups.length || query.windows.length;
  // "Who teaches <course>": the main teacher, plus directory teachers of that code.
  if (query.meta.length === 1 && query.meta[0][0] === 'teacher' && query.codes.length && !hasRowFilters && !query.fields.length) {
    const directory = schedule.ocrTeacherDirectory?.teachers || [];
    const lines = []; const sources = [source('ผู้สอน', 'meta.teacher')];
    for (const code of query.codes) {
      const course = courses.find(item => item.code === code);
      sources.push(courseSource(course, courses));
      lines.push(`${code} ${course.name}: ${schedule.meta?.teacher || 'ไม่พบข้อมูลผู้สอน'} (ตารางภาคเรียน ${schedule.meta?.semester || '-'})`);
      const others = directory.filter(teacher => (teacher.courses || []).some(item => item.code === code));
      if (others.length) {
        lines.push(`   รายชื่อครู OCR ภาคเรียน ${schedule.ocrTeacherDirectory?.meta?.semester || '-'} ที่สอนวิชานี้ด้วย: ${others.map(teacher => teacher.name).join(', ')}`);
        others.forEach(teacher => sources.push(source(`รายชื่อครู (OCR): ${teacher.name}`, `ocrTeacherDirectory.teachers[${directory.indexOf(teacher)}]`)));
      }
    }
    return result('answered', lines.join('\n'), sources);
  }
  if (query.meta.length) {
    if (hasRowFilters || query.codes.length || query.fields.length) return result('clarification', 'กรุณาถามข้อมูลครูหรือภาคเรียนแยกจากรายละเอียดคาบเรียน เพื่อให้ตอบได้ตรงข้อมูลค่ะ', [], EXAMPLES);
    const lines = query.meta.map(([key, label]) => `${label}: ${schedule.meta?.[key] || 'ไม่พบข้อมูล'}`);
    const sources = query.meta.filter(([key]) => schedule.meta?.[key]).map(([key, label]) => source(label, `meta.${key}`));
    return result(sources.length ? 'answered' : 'not_found', lines.join('\n'), sources);
  }
  if (query.periodList && !hasRowFilters && !query.codes.length) {
    return result('answered', (schedule.periods || []).map(item => `คาบที่ ${item.period}: ${item.time} น.`).join('\n'), [source('เวลาประจำคาบ', 'periods')]);
  }
  if (query.periods.length && !query.days.length && !query.codes.length && !query.rooms.length && !query.groups.length && !/เรียน|สอน|วิชา|ห้อง|กลุ่ม/.test(query.text)) {
    return result('answered', query.periods.map(item => `คาบที่ ${item.period}: ${item.time} น.`).join('\n'), query.periods.map(item => source(`เวลาคาบที่ ${item.period}`, `periods[${schedule.periods.indexOf(item)}]`)));
  }

  let rows = allRows.filter(row => (!query.days.length || query.days.includes(row.day))
    && (!query.codes.length || query.codes.includes(row.courseCode))
    && (!query.rooms.length || query.rooms.includes(normalize(row.room).replace(/\s/g, '')))
    && (!query.groups.length || query.groups.some(group => groupMembers(group).some(member => groupMembers(row.group).includes(member))))
    && (!query.windows.length || query.windows.some(([start, end]) => { const [rowStart, rowEnd] = row.time.split('-').map(minutes); return rowStart < end && rowEnd > start; })));
  const selectedCourses = query.codes.length ? courses.filter(course => query.codes.includes(course.code)) : courses;
  const fieldLabels = { credit: 'หน่วยกิต', theory: 'ทฤษฎี', practice: 'ปฏิบัติ', hours: 'ชั่วโมง' };
  const sources = [];
  const periods = schedule.periods || [];
  // Count only periods inside the asked time window, e.g. "ช่วงบ่าย".
  const inWindow = period => !query.windows.length || query.windows.some(([start, end]) => { const [periodStart, periodEnd] = period.time.split('-').map(minutes); return periodStart < end && periodEnd > start; });
  const countOf = list => list.reduce((sum, row) => sum + periodsOf(row, periods).filter(inWindow).length, 0);
  const hoursOf = list => round(list.reduce((sum, row) => sum + durationInWindows(row, query.windows.filter(([start, end]) => end - start > 1)), 0));
  const courseName = code => courses.find(course => course.code === code)?.name || code;
  const startOf = row => minutes(row.time.split('-')[0]);
  const endOf = row => minutes(row.time.split('-')[1]);
  const describe = row => {
    const label = periodLabel(periodsOf(row, periods));
    return `${row.time} น.${label ? ` (${label})` : ''} — ${courseName(row.courseCode)} (${row.courseCode}) · ห้อง ${row.room} · กลุ่ม ${row.group}`;
  };
  const periodSource = periods.length ? [source('เวลาประจำคาบ', 'periods')] : [];

  // "Which day/course/room/group has the most (or least)" ranks by periods,
  // by hours when asked, or by recorded credits for courses.
  if (query.superlative) {
    const dimension = /วิชา/.test(query.text) ? 'course' : /ห้อง/.test(query.text) ? 'room' : /กลุ่ม/.test(query.text) ? 'group' : 'day';
    const byCredit = dimension === 'course' && query.fields.includes('credit');
    const unit = byCredit ? 'หน่วยกิต' : query.fields.includes('hours') ? 'ชั่วโมง' : 'คาบ';
    const measure = list => unit === 'ชั่วโมง' ? hoursOf(list) : countOf(list);
    let entries;
    if (byCredit) {
      entries = courses.map(course => [`${course.code} ${course.name}`, course.credit, courseSource(course, courses)]);
    } else {
      const keyOf = { day: row => `วัน${row.day}`, course: row => `${row.courseCode} ${courseName(row.courseCode)}`, room: row => `ห้อง ${row.room}`, group: row => `กลุ่ม ${row.group}` }[dimension];
      const ordered = dimension === 'day' ? WEEK_ORDER.map(day => `วัน${day}`).filter(key => rows.some(row => keyOf(row) === key)) : unique(rows.map(keyOf));
      entries = ordered.map(key => [key, measure(rows.filter(row => keyOf(row) === key))]);
      rows.forEach(row => sources.push(source(`วัน${row.day} ${row.time} ${row.courseCode}`, row.path)));
    }
    if (!entries.length) return missing('ไม่พบรายการเรียนที่ตรงกับเงื่อนไขในตารางนี้');
    const target = query.superlative === 'max' ? Math.max(...entries.map(entry => entry[1])) : Math.min(...entries.map(entry => entry[1]));
    const winners = entries.filter(entry => entry[1] === target).map(entry => entry[0]);
    const noun = { day: 'วัน', course: 'วิชา', room: 'ห้อง', group: 'กลุ่ม' }[dimension];
    const adjective = query.superlative === 'max' ? (byCredit ? 'หน่วยกิตมากที่สุด' : 'สอนมากที่สุด') : (byCredit ? 'หน่วยกิตน้อยที่สุด' : 'สอนน้อยที่สุด');
    const ranking = [...entries].sort((a, b) => b[1] - a[1]).map(([key, value]) => `${key}: ${value} ${unit}`);
    const note = dimension === 'day' && query.superlative === 'min' ? '\nนับเฉพาะวันที่มีรายการสอนในตาราง' : '';
    if (byCredit) sources.push(...entries.map(entry => entry[2]));
    return result('answered', `${noun}ที่${adjective}: ${winners.join(', ')} (${target} ${unit})${winners.length > 1 ? ' เท่ากัน' : ''}\n\nเรียงลำดับ:\n${ranking.join('\n')}${note}`, [...sources, ...(byCredit ? [] : periodSource)]);
  }

  const summaryIntent = query.periodCount || query.perDay || query.daySummary || query.startEnd;
  if (query.fields.length && !hasRowFilters && !query.scheduleIntent && !summaryIntent) {
    if (query.total && !query.codes.length) {
      if (query.fields.includes('hours')) {
        const weekly = hoursOf(allRows); const weeklyPeriods = allRows.reduce((sum, row) => sum + periodsOf(row, periods).length, 0);
        sources.push(...periodSource);
        const lead = `ตามตารางรายวัน สอน ${weekly} ชั่วโมงต่อสัปดาห์ (${weeklyPeriods} คาบ)`;
        const detail = query.fields.map(field => {
          const stored = schedule.totals?.[field];
          const values = courses.map(course => course[field]);
          const sum = values.every(value => typeof value === 'number') ? values.reduce((a, b) => a + b, 0) : null;
          if (stored !== undefined) sources.push(source(`ยอดรวม${fieldLabels[field]}ที่บันทึกไว้`, `totals.${field}`));
          return `${fieldLabels[field]}: ยอดรวมที่บันทึกไว้ ${stored ?? 'ไม่พบข้อมูล'}; ผลบวกรายวิชา ${sum ?? 'คำนวณไม่ได้'}${field === 'hours' ? `; รวมช่วงเวลาในตารางรายวัน ${weekly} ชั่วโมง` : ''}`;
        });
        sources.push(...courses.map(course => courseSource(course, courses)), ...allRows.map(row => source(`วัน${row.day} ${row.time}`, row.path)));
        return result('answered', `${lead}\n\n${detail.join('\n')}\nตัวเลขเป็นคนละส่วนของข้อมูล หากไม่ตรงกันควรตรวจสอบตารางต้นฉบับ ไม่ถือว่าค่าใดถูกต้องกว่าโดยอัตโนมัติ`, sources);
      }
      const lines = query.fields.map(field => {
        const stored = schedule.totals?.[field];
        const values = courses.map(course => course[field]);
        const sum = values.every(value => typeof value === 'number') ? values.reduce((a, b) => a + b, 0) : null;
        if (stored !== undefined) sources.push(source(`ยอดรวม${fieldLabels[field]}ที่บันทึกไว้`, `totals.${field}`));
        sources.push(...courses.map(course => courseSource(course, courses)));
        let line = `${fieldLabels[field]}: ยอดรวมที่บันทึกไว้ ${stored ?? 'ไม่พบข้อมูล'}; ผลบวกรายวิชา ${sum ?? 'คำนวณไม่ได้'}`;
        if (field === 'hours') {
          line += `; รวมช่วงเวลาในตารางรายวัน ${allRows.reduce((sum, row) => sum + duration(row), 0)} ชั่วโมง`;
          sources.push(...allRows.map(row => source(`วัน${row.day} ${row.time}`, row.path)));
        }
        return line;
      });
      return result('answered', `${lines.join('\n')}\nตัวเลขเป็นคนละส่วนของข้อมูล หากไม่ตรงกันควรตรวจสอบตารางต้นฉบับ ไม่ถือว่าค่าใดถูกต้องกว่าโดยอัตโนมัติ`, sources);
    }
    const lines = selectedCourses.map(course => {
      sources.push(courseSource(course, courses));
      const details = query.fields.map(field => `${fieldLabels[field]}ที่บันทึกในรายวิชา ${course[field] ?? 'ไม่พบข้อมูล'}`);
      if (query.fields.includes('hours')) {
        const slots = allRows.filter(row => row.courseCode === course.code);
        details.push(`รวมช่วงเวลาที่พบในตารางรายวัน ${slots.reduce((sum, row) => sum + duration(row), 0)} ชั่วโมง (คำนวณจากช่วงเวลา)`);
        sources.push(...slots.map(row => source(`วัน${row.day} ${row.time}`, row.path)));
      }
      return `${course.code} ${course.name}: ${details.join('; ')}`;
    });
    return result('answered', lines.join('\n'), sources);
  }
  if (query.catalog && !hasRowFilters && !query.codes.length) return result('answered', `มีข้อมูล ${courses.length} วิชา\n${courses.map(course => `${course.code} — ${course.name}`).join('\n')}`, courses.map(course => courseSource(course, courses)));
  if (query.fields.includes('theory') && !query.fields.includes('practice')) rows = rows.filter(row => row.type === 'ทฤษฎี');
  if (query.fields.includes('practice') && !query.fields.includes('theory')) rows = rows.filter(row => row.type === 'ปฏิบัติ');
  // A known day with nothing in the asked time window: stay not_found (the
  // table may be incomplete), but show that day's recorded classes.
  if (!rows.length && query.days.length && query.windows.length && !query.codes.length && !query.rooms.length && !query.groups.length && !query.fields.length) {
    const dayRows = allRows.filter(row => query.days.includes(row.day)).sort((a, b) => startOf(a) - startOf(b));
    dayRows.forEach(row => sources.push(source(`วัน${row.day} ${row.time} ${row.courseCode}`, row.path)));
    const days = query.days.map(day => `วัน${day}`).join(', ');
    return result('not_found', `ไม่พบคาบสอนของ${days}ในช่วงเวลาที่ถาม (ตารางอาจบันทึกไม่ครบ จึงยืนยันไม่ได้ว่าว่าง)${dayRows.length ? `\nคาบสอนที่บันทึกไว้ของ${days}:\n${dayRows.map(row => `วัน${row.day} ${describe(row)}`).join('\n')}` : ''}`, [...sources, ...periodSource], EXAMPLES);
  }
  if (!rows.length) return missing('ไม่พบรายการเรียนที่ตรงกับเงื่อนไขในตารางนี้');
  if (query.fields.includes('credit')) return result('clarification', 'หน่วยกิตเป็นข้อมูลรายวิชา กรุณาระบุชื่อหรือรหัสวิชาเพื่อถามหน่วยกิตค่ะ', [], EXAMPLES);

  const byDay = WEEK_ORDER.map(day => [day, rows.filter(row => row.day === day)]).filter(([, list]) => list.length);
  const dayLine = ([day, list]) => `วัน${day}: ${countOf(list)} คาบ (${hoursOf(list)} ชั่วโมง) — ${unique(list.map(row => courseName(row.courseCode))).join(', ')}`;
  const rowSources = () => rows.forEach(row => sources.push(source(`วัน${row.day} ${row.time} ${row.courseCode}`, row.path)));
  const lines = rows.map(row => {
    const course = courses.find(item => item.code === row.courseCode);
    sources.push(source(`วัน${row.day} ${row.time} ${row.courseCode}`, row.path));
    if (course) sources.push(courseSource(course, courses));
    const label = periodLabel(periodsOf(row, periods));
    return `วัน${row.day} ${row.time} น.${label ? ` (${label})` : ''} — ${course?.name || row.courseCode} (${row.courseCode})\n${row.type} · ห้อง ${row.room} · กลุ่ม ${row.group} · นักเรียน ${row.students ?? 'ไม่ระบุ'} คน`;
  });
  const note = query.relative ? 'อ้างอิงวันตามเวลาประเทศไทยและตารางประจำสัปดาห์ (ข้อมูลนี้ไม่ยืนยันวันหยุดหรือการเปลี่ยนแปลงเฉพาะวันที่)\n' : '';
  const narrowed = query.codes.length || query.rooms.length || query.groups.length;
  const wholeWeek = !query.days.length && !query.windows.length;
  const courseSummaryFirst = query.courseSummary && wholeWeek && !query.codes.length && !query.startEnd;
  const prefix = note + (query.courseCount && !courseSummaryFirst ? `พบ ${unique(rows.map(row => row.courseCode)).length} วิชาที่ตรงเงื่อนไข\n` : '');
  const sorted = [...rows].sort((a, b) => startOf(a) - startOf(b));

  // "What is being taught now" / "next class", from today's rows and Bangkok time.
  if (query.nowMode) {
    const now = bangkokMinutes(options);
    const current = sorted.filter(row => startOf(row) <= now && now < endOf(row));
    const next = sorted.find(row => startOf(row) > now);
    const header = `ขณะนี้ ${clock(now)} น. วัน${query.days[0]}`;
    const nextLine = next ? `คาบถัดไป: ${describe(next)}` : 'วันนี้ไม่มีคาบสอนหลังจากนี้แล้วตามตาราง';
    const body = query.nowMode === 'now'
      ? `${current.length ? `กำลังสอน:\n${current.map(describe).join('\n')}` : 'ไม่มีคาบสอนในเวลานี้ตามตาราง'}\n${nextLine}`
      : nextLine;
    [...current, ...(next ? [next] : [])].forEach(row => sources.push(source(`วัน${row.day} ${row.time} ${row.courseCode}`, row.path)));
    return result('answered', `${note}${header}\n${body}`, [...sources, ...periodSource]);
  }
  // First or last class of each requested day.
  if (query.firstLast) {
    const summary = byDay.map(([day, list]) => {
      const row = query.firstLast === 'first' ? [...list].sort((a, b) => startOf(a) - startOf(b))[0] : [...list].sort((a, b) => endOf(b) - endOf(a))[0];
      sources.push(source(`วัน${row.day} ${row.time} ${row.courseCode}`, row.path));
      return `วัน${day} ${query.firstLast === 'first' ? 'คาบแรก' : 'คาบสุดท้าย'}: ${describe(row)}`;
    });
    return result('answered', prefix + summary.join('\n'), [...sources, ...periodSource]);
  }
  // Back-to-back teaching blocks per day.
  if (query.consecutive) {
    const summary = byDay.map(([day, list]) => {
      const blocks = [];
      for (const row of [...list].sort((a, b) => startOf(a) - startOf(b))) {
        const block = blocks.at(-1);
        if (block && startOf(row) <= block.end) { block.rows.push(row); block.end = Math.max(block.end, endOf(row)); } else blocks.push({ start: startOf(row), end: endOf(row), rows: [row] });
      }
      const longest = [...blocks].sort((a, b) => countOf(b.rows) - countOf(a.rows))[0];
      list.forEach(row => sources.push(source(`วัน${row.day} ${row.time} ${row.courseCode}`, row.path)));
      return `วัน${day}: ติดกันนานสุด ${countOf(longest.rows)} คาบ (${clock(longest.start)}-${clock(longest.end)} น.)${blocks.length > 1 ? `\n   ช่วงสอนทั้งหมด: ${blocks.map(block => `${clock(block.start)}-${clock(block.end)} (${countOf(block.rows)} คาบ)`).join(', ')}` : ''}`;
    });
    return result('answered', prefix + summary.join('\n'), [...sources, ...periodSource]);
  }
  // Which rooms or groups appear, with their days and period counts.
  if (query.roomSummary || query.groupSummary) {
    const key = query.roomSummary ? 'room' : 'group';
    const names = unique(rows.map(row => row[key]));
    const summary = names.map(name => {
      const list = rows.filter(row => row[key] === name);
      list.forEach(row => sources.push(source(`วัน${row.day} ${row.time} ${row.courseCode}`, row.path)));
      const days = WEEK_ORDER.filter(day => list.some(row => row.day === day)).map(day => `วัน${day}`);
      return `${query.roomSummary ? 'ห้อง ' : 'กลุ่ม '}${name}: ${days.join(', ')} · ${countOf(list)} คาบ`;
    });
    return result('answered', `${prefix}${query.roomSummary ? `ใช้ ${names.length} ห้อง` : `สอน ${names.length} กลุ่ม`}\n${summary.join('\n')}`, [...sources, ...periodSource]);
  }

  // Start and end of each teaching day.
  if (query.startEnd) {
    const summary = byDay.map(([day, list]) => {
      const first = [...list].sort((a, b) => minutes(a.time.split('-')[0]) - minutes(b.time.split('-')[0]))[0];
      const last = [...list].sort((a, b) => minutes(b.time.split('-')[1]) - minutes(a.time.split('-')[1]))[0];
      const firstPeriod = periodsOf(first, periods)[0]; const lastPeriod = periodsOf(last, periods).at(-1);
      return `วัน${day}: เริ่ม ${first.time.split('-')[0]} น.${firstPeriod ? ` (คาบที่ ${firstPeriod.period})` : ''} เลิก ${last.time.split('-')[1]} น.${lastPeriod ? ` (คาบที่ ${lastPeriod.period})` : ''}`;
    });
    if (wholeWeek && !narrowed) { rowSources(); return result('answered', prefix + summary.join('\n'), [...sources, ...periodSource]); }
    return result('answered', `${prefix}${summary.join('\n')}\n\n${lines.join('\n\n')}`, [...sources, ...periodSource]);
  }
  // "Which courses do you teach" over the whole week: one line per course.
  if (courseSummaryFirst) {
    const found = unique(rows.map(row => row.courseCode));
    const summary = found.map(code => {
      const list = rows.filter(row => row.courseCode === code);
      const course = courses.find(item => item.code === code);
      if (course) sources.push(courseSource(course, courses));
      return `${code} ${courseName(code)}\n   สอนวัน${unique(WEEK_ORDER.filter(day => list.some(row => row.day === day))).join(', วัน')} · รวม ${countOf(list)} คาบต่อสัปดาห์`;
    });
    rowSources();
    return result('answered', `${prefix}สอนทั้งหมด ${found.length} วิชา\n${summary.join('\n')}`, [...sources, ...periodSource]);
  }
  // Days and period counts, as a weekly overview or for the requested day(s).
  if (summaryIntent) {
    const totalLine = byDay.length > 1 ? `สอน ${byDay.length} วัน (${byDay.map(([day]) => `วัน${day}`).join(', ')}) รวม ${countOf(rows)} คาบ (${hoursOf(rows)} ชั่วโมง)\n` : '';
    let mismatch = '';
    const stored = schedule.totals?.hours;
    if (wholeWeek && !narrowed && typeof stored === 'number' && stored !== hoursOf(allRows)) {
      mismatch = `\nหมายเหตุ: ยอดชั่วโมงที่บันทึกไว้ในตาราง ${stored} ชั่วโมง ไม่ตรงกับคาบที่พบในตารางรายวัน ${hoursOf(allRows)} ชั่วโมง ควรตรวจสอบตารางต้นฉบับค่ะ`;
      sources.push(source('ยอดรวมชั่วโมงที่บันทึกไว้', 'totals.hours'));
    }
    const summary = prefix + totalLine + byDay.map(dayLine).join('\n') + mismatch;
    if (wholeWeek && !narrowed) { rowSources(); return result('answered', summary, [...sources, ...periodSource]); }
    return result('answered', `${summary}\n\n${lines.join('\n\n')}`, [...sources, ...periodSource]);
  }
  // A clock point identifies a slot; a range/period bounds the requested duration.
  const durationWindows = query.windows.filter(([start, end]) => end - start > 1);
  const hours = query.fields.includes('hours') ? `\nรวมช่วงเวลาที่ตรงเงื่อนไข ${Number(rows.reduce((sum, row) => sum + durationInWindows(row, durationWindows), 0).toFixed(2))} ชั่วโมง (${durationWindows.length ? 'คำนวณเฉพาะส่วนที่ทับซ้อนช่วงเวลาที่ถาม' : 'คำนวณจากช่วงเวลาเต็มของแต่ละรายการ'})` : '';
  const studentsNote = query.students && rows.length > 1 ? '\nจำนวนนักเรียนเป็นค่าของแต่ละรายการ ไม่รวมเป็นจำนวนคนไม่ซ้ำ เพราะกลุ่มเดียวกันอาจปรากฏหลายครั้ง' : '';
  // A day question always opens with that day's period count.
  const dayHeader = query.days.length && !query.windows.length ?`${byDay.map(dayLine).join('\n')}\n\n` : '';
  return result('answered', prefix + dayHeader + lines.join('\n\n') + hours + studentsNote, [...sources, ...(dayHeader ? periodSource : [])]);
}
