import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fetchSchedule, fromRows, toRows, TABLES } from '../src/supabase.js';
import { createScheduleStore, scheduleStoreFromEnv } from '../src/store.js';
import { createApp } from '../src/app.js';

const schedule = JSON.parse(readFileSync(new URL('../data/schedule.json', import.meta.url), 'utf8'));

// Serves table rows the way Supabase's REST API does.
function fakeSupabase(rows, calls = []) {
  return async (url, options) => {
    calls.push({ url, options });
    const table = new URL(url).pathname.split('/').pop();
    if (!(table in rows)) return new Response('missing', { status: 404 });
    return new Response(JSON.stringify(rows[table]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
}

test('schedule survives the round trip through database rows unchanged', () => {
  assert.deepEqual(fromRows(toRows(schedule)), schedule);
  const rows = toRows(schedule);
  assert.equal(rows.courses.length, 4);
  assert.equal(rows.weekly_schedule.length, Object.values(schedule.weeklySchedule).flat().length);
  assert.equal(rows.directory_teachers.length, 17);
  assert.ok(rows.directory_courses.every(course => rows.directory_teachers.some(teacher => teacher.id === course.teacher_id)));
  assert.ok(rows.weekly_schedule.every(row => rows.courses.some(course => course.code === row.course_code)));
});

test('fetchSchedule reads every table with the publishable key and rebuilds the schedule', async () => {
  const calls = [];
  const loaded = await fetchSchedule({ url: 'https://demo.supabase.co/', key: 'sb_publishable_test', fetchImpl: fakeSupabase(toRows(schedule), calls) });
  assert.deepEqual(loaded, schedule);
  assert.equal(calls.length, Object.keys(TABLES).length);
  for (const { url, options } of calls) {
    assert.match(url, /^https:\/\/demo\.supabase\.co\/rest\/v1\/[a-z_]+\?select=\*&order=/);
    assert.equal(options.headers.apikey, 'sb_publishable_test');
  }
});

test('Supabase errors and an empty database are reported, not answered from', async () => {
  const rows = toRows(schedule);
  delete rows.periods;
  await assert.rejects(fetchSchedule({ url: 'https://demo.supabase.co', key: 'k', fetchImpl: fakeSupabase(rows) }), /table periods: HTTP 404/);
  const empty = Object.fromEntries(Object.keys(TABLES).map(table => [table, []]));
  await assert.rejects(fetchSchedule({ url: 'https://demo.supabase.co', key: 'k', fetchImpl: fakeSupabase(empty) }), /schedule_meta has no row/);
});

test('store caches loads, refreshes after the TTL, and keeps the last good copy on failure', async () => {
  let clock = 0; let loads = 0; let fail = false;
  const store = createScheduleStore({ ttlMs: 1000, now: () => clock, load: async () => { loads++; if (fail) throw new Error('down'); return schedule; } });
  await store.get(); await store.get();
  assert.equal(loads, 1);
  clock = 1500; fail = true;
  const original = console.error; console.error = () => {};
  try { assert.deepEqual(await store.get(), schedule); } finally { console.error = original; }
  assert.equal(loads, 2);
  const broken = createScheduleStore({ load: async () => ({ ...schedule, courses: 'bad' }) });
  await assert.rejects(broken.get(), /Invalid schedule data/);
});

test('environment picks JSON or Supabase and rejects unsafe or partial settings', () => {
  assert.equal(scheduleStoreFromEnv({}).source, 'json');
  assert.equal(scheduleStoreFromEnv({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_KEY: 'sb_publishable_x' }).source, 'supabase');
  assert.throws(() => scheduleStoreFromEnv({ SUPABASE_URL: 'https://x.supabase.co' }), /Set both SUPABASE_URL and SUPABASE_KEY/);
  assert.throws(() => scheduleStoreFromEnv({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_KEY: 'sb_secret_x' }), /publishable/);
});

test('API answers from a Supabase-backed store and returns 503 when it cannot load', async () => {
  const serve = async (store) => {
    const server = createApp({ store, clientDir: null }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    return { server, base: `http://127.0.0.1:${server.address().port}` };
  };
  const good = await serve(createScheduleStore({ load: () => fetchSchedule({ url: 'https://demo.supabase.co', key: 'k', fetchImpl: fakeSupabase(toRows(schedule)) }) }));
  try {
    const chat = await (await fetch(`${good.base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'วันจันทร์สอนกี่คาบ' }) })).json();
    assert.match(chat.reply, /วันจันทร์: 8 คาบ/);
    assert.equal((await (await fetch(`${good.base}/api/health`)).json()).dataSource, 'supabase');
  } finally { good.server.close(); }
  const original = console.error; console.error = () => {};
  const bad = await serve(createScheduleStore({ load: async () => { throw new Error('offline'); } }));
  try {
    const response = await fetch(`${bad.base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'วันจันทร์' }) });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /โหลดข้อมูลตารางสอนไม่สำเร็จ/);
  } finally { bad.server.close(); console.error = original; }
});
