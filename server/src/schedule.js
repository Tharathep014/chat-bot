import { readFileSync } from 'node:fs';

export const schedulePath = new URL('../data/schedule.json', import.meta.url);
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d$/;
export const minutes = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

export function validateSchedule(schedule) {
  const fail = (field) => { throw new Error(`Invalid schedule data: ${field}`); };
  const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!object(schedule) || !object(schedule.meta) || !Array.isArray(schedule.courses)
    || !Array.isArray(schedule.periods) || !object(schedule.weeklySchedule) || !object(schedule.totals)) {
    fail('meta, courses, periods, totals and weeklySchedule are required');
  }
  const validTime = (time) => typeof time === 'string' && timePattern.test(time)
    && minutes(time.split('-')[0]) < minutes(time.split('-')[1]);
  const codes = new Set();
  for (const course of schedule.courses) {
    if (!object(course) || typeof course.code !== 'string' || !course.code.trim()
      || typeof course.name !== 'string' || !course.name.trim() || codes.has(course.code)) fail('course code/name');
    codes.add(course.code);
    for (const field of ['theory', 'practice', 'credit', 'hours']) {
      if (!Number.isFinite(course[field]) || course[field] < 0) fail(`course.${field}`);
    }
  }
  const days = new Set(['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']);
  for (const [day, entries] of Object.entries(schedule.weeklySchedule)) {
    if (!days.has(day) || !Array.isArray(entries)) fail('weeklySchedule day');
    for (const row of entries) {
      if (!object(row) || !codes.has(row.courseCode) || !validTime(row.time)) fail(`${day}: courseCode/time`);
      for (const field of ['type', 'room', 'group']) {
        if (typeof row[field] !== 'string' || !row[field].trim()) fail(`${day}: ${field}`);
      }
      if (!Number.isInteger(row.students) || row.students < 0) fail(`${day}: students`);
    }
  }
  const periodNumbers = new Set();
  for (const period of schedule.periods) {
    if (!object(period) || !Number.isInteger(period.period) || period.period < 1
      || periodNumbers.has(period.period) || !validTime(period.time)) fail('period');
    periodNumbers.add(period.period);
  }
  for (const field of ['theory', 'practice', 'credit', 'hours']) {
    if (!Number.isFinite(schedule.totals[field]) || schedule.totals[field] < 0) fail(`totals.${field}`);
  }
  return schedule;
}

export function loadSchedule(file = schedulePath) {
  return validateSchedule(JSON.parse(readFileSync(file, 'utf8')));
}

export function dataWarnings(schedule) {
  const courseHours = schedule.courses.reduce((sum, course) => sum + course.hours, 0);
  const weeklyHours = Object.values(schedule.weeklySchedule).flat().reduce((sum, row) => {
    const [start, end] = row.time.split('-');
    return sum + (minutes(end) - minutes(start)) / 60;
  }, 0);
  return new Set([schedule.totals.hours, courseHours, weeklyHours]).size > 1
    ? [`ข้อมูลชั่วโมงไม่ตรงกัน: ช่องยอดรวม ${schedule.totals.hours} ชั่วโมง, ผลรวมรายวิชา ${courseHours} ชั่วโมง, ช่วงเวลาในตาราง ${weeklyHours} ชั่วโมง`]
    : [];
}
