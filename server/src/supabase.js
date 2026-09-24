// Maps the schedule object to Supabase (PostgreSQL) table rows and back.
// toRows feeds the seed script; fromRows rebuilds the exact object the chatbot
// uses, so answer.js never needs to know where the data came from.

const DAY_ORDER = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

// Table name -> PostgREST order clause used when reading.
export const TABLES = {
  schedule_meta: 'id.asc',
  courses: 'sort_order.asc',
  periods: 'period.asc',
  weekly_schedule: 'sort_order.asc',
  directory_meta: 'id.asc',
  directory_signatories: 'sort_order.asc',
  directory_teachers: 'sort_order.asc',
  directory_courses: 'sort_order.asc',
  class_groups: 'sort_order.asc',
  class_group_courses: 'sort_order.asc',
};

// Optional keys are left out of the rebuilt object when the column is null.
const optional = (object, key, value) => { if (value !== null && value !== undefined) object[key] = value; return object; };

export function toRows(schedule) {
  const { meta, totals, ocrTeacherDirectory: directory } = schedule;
  const rows = {
    schedule_meta: [{
      id: 1, semester: meta.semester ?? null, department: meta.department ?? null, teacher: meta.teacher ?? null,
      qualification: meta.qualification ?? null, role: meta.role ?? null, week_range: meta.weekRange ?? null, note: meta.note ?? null,
      total_theory: totals.theory, total_practice: totals.practice, total_credit: totals.credit, total_hours: totals.hours,
    }],
    courses: schedule.courses.map((course, index) => ({
      code: course.code, name: course.name, theory: course.theory, practice: course.practice, credit: course.credit, hours: course.hours, sort_order: index + 1,
    })),
    periods: schedule.periods.map(period => ({ period: period.period, time_range: period.time })),
    weekly_schedule: Object.entries(schedule.weeklySchedule).flatMap(([day, entries]) => entries.map(entry => ({
      day, time_range: entry.time, type: entry.type, course_code: entry.courseCode, room: entry.room, group_name: entry.group, students: entry.students,
    }))).map((row, index) => ({ ...row, sort_order: index + 1 })),
    directory_meta: [], directory_signatories: [], directory_teachers: [], directory_courses: [], class_groups: [], class_group_courses: [],
  };
  if (!directory) return rows;
  rows.directory_meta.push({ id: 1, source: directory.meta?.source ?? null, college: directory.meta?.college ?? null, semester: directory.meta?.semester ?? null, department: directory.meta?.department ?? null, note: directory.meta?.note ?? null });
  (directory.signatories || []).forEach((person, index) => rows.directory_signatories.push({ name: person.name, position: person.position, sort_order: index + 1 }));
  (directory.teachers || []).forEach((teacher, index) => {
    const id = index + 1;
    rows.directory_teachers.push({
      id, name: teacher.name, program: teacher.program ?? null, qualification: teacher.qualification ?? null, role: teacher.role ?? null,
      ocr_role: teacher.ocrRole ?? null, note: teacher.note ?? null, source_pages: teacher.sourcePages || [], sort_order: id,
    });
    (teacher.courses || []).forEach(course => rows.directory_courses.push({
      teacher_id: id, code: course.code ?? null, name: course.name ?? null, ocr_name: course.ocrName ?? null, confidence: course.confidence ?? null, note: course.note ?? null,
    }));
  });
  (directory.classGroups || []).forEach((group, index) => {
    const id = index + 1;
    rows.class_groups.push({ id, group_code: group.group, advisor: group.advisor ?? null, program: group.program ?? null, source_pages: group.sourcePages || [], sort_order: id });
    (group.courses || []).forEach(course => rows.class_group_courses.push({
      group_id: id, code: course.code ?? null, name: course.name ?? null, ocr_name: course.ocrName ?? null, confidence: course.confidence ?? null, teacher: course.teacher ?? null,
    }));
  });
  rows.directory_courses = rows.directory_courses.map((row, index) => ({ ...row, sort_order: index + 1 }));
  rows.class_group_courses = rows.class_group_courses.map((row, index) => ({ ...row, sort_order: index + 1 }));
  return rows;
}

export function fromRows(rows) {
  const meta = rows.schedule_meta?.[0];
  if (!meta) throw new Error('Supabase table schedule_meta has no row (id = 1). Run supabase/seed.sql first.');
  const bySort = list => [...(list || [])].sort((a, b) => a.sort_order - b.sort_order);
  const schedule = {
    meta: {},
    // PostgreSQL numeric may arrive as a string; the chatbot needs numbers.
    courses: bySort(rows.courses).map(({ code, name, theory, practice, credit, hours }) => ({ code, name, theory: Number(theory), practice: Number(practice), credit: Number(credit), hours: Number(hours) })),
    totals: { theory: Number(meta.total_theory), practice: Number(meta.total_practice), credit: Number(meta.total_credit), hours: Number(meta.total_hours) },
    periods: [...(rows.periods || [])].sort((a, b) => a.period - b.period).map(row => ({ period: row.period, time: row.time_range })),
    weeklySchedule: {},
  };
  for (const [column, key] of [['semester', 'semester'], ['department', 'department'], ['teacher', 'teacher'], ['qualification', 'qualification'], ['role', 'role'], ['week_range', 'weekRange'], ['note', 'note']]) {
    optional(schedule.meta, key, meta[column]);
  }
  const weekly = bySort(rows.weekly_schedule);
  for (const day of DAY_ORDER) {
    const entries = weekly.filter(row => row.day === day);
    if (entries.length) schedule.weeklySchedule[day] = entries.map(row => ({ time: row.time_range, type: row.type, courseCode: row.course_code, room: row.room, group: row.group_name, students: row.students }));
  }
  const directoryMeta = rows.directory_meta?.[0];
  if (!directoryMeta) return schedule;
  const courses = bySort(rows.directory_courses);
  const groupCourses = bySort(rows.class_group_courses);
  schedule.ocrTeacherDirectory = {
    meta: { source: directoryMeta.source, college: directoryMeta.college, semester: directoryMeta.semester, department: directoryMeta.department, note: directoryMeta.note },
    signatories: bySort(rows.directory_signatories).map(({ name, position }) => ({ name, position })),
    teachers: bySort(rows.directory_teachers).map(teacher => {
      const item = { name: teacher.name, program: teacher.program, qualification: teacher.qualification, role: teacher.role };
      optional(item, 'ocrRole', teacher.ocr_role);
      optional(item, 'note', teacher.note);
      item.sourcePages = teacher.source_pages || [];
      item.courses = courses.filter(course => course.teacher_id === teacher.id).map(course => {
        const entry = { code: course.code, name: course.name };
        optional(entry, 'ocrName', course.ocr_name);
        optional(entry, 'note', course.note);
        entry.confidence = course.confidence;
        return entry;
      });
      return item;
    }),
    classGroups: bySort(rows.class_groups).map(group => ({
      group: group.group_code, advisor: group.advisor, program: group.program, sourcePages: group.source_pages || [],
      courses: groupCourses.filter(course => course.group_id === group.id).map(course => {
        const entry = { code: course.code, name: course.name };
        optional(entry, 'ocrName', course.ocr_name);
        optional(entry, 'teacher', course.teacher);
        entry.confidence = course.confidence;
        return entry;
      }),
    })),
  };
  return schedule;
}

// Reads every table through Supabase's REST API (PostgREST). Only the public
// publishable/anon key is needed because the tables allow read-only access.
export async function fetchSchedule({ url, key, fetchImpl = fetch, timeoutMs = 8000 }) {
  const base = url.replace(/\/+$/, '');
  const entries = await Promise.all(Object.entries(TABLES).map(async ([table, order]) => {
    const response = await fetchImpl(`${base}/rest/v1/${table}?select=*&order=${order}`, {
      headers: { apikey: key, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Supabase table ${table}: HTTP ${response.status} ${detail.slice(0, 200)}`);
    }
    return [table, await response.json()];
  }));
  return fromRows(Object.fromEntries(entries));
}
