import { useEffect, useRef, useState } from 'react';

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
const EXAMPLES = ['วันจันทร์มีสอนวิชาอะไรบ้าง', 'วิชา 31901-2007 เรียนห้องไหน', 'วันพุธมีสอนเวลาไหนบ้าง'];
const STATUS = {
  answered: { label: 'พบข้อมูลในตาราง', className: 'answered', icon: 'check' },
  not_found: { label: 'ไม่พบข้อมูลในตาราง', className: 'not-found', icon: 'info' },
  out_of_scope: { label: 'นอกขอบเขตตารางสอน', className: 'out-of-scope', icon: 'shield' },
  clarification: { label: 'ขอรายละเอียดเพิ่มเติม', className: 'clarification', icon: 'info' },
};

function Icon({ name, size = 20, ...props }) {
  const shapes = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2" /></>,
    chat: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /><path d="M8 11h8m-8 4h5" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    send: <path d="m12 19 0-14m-6 6 6-6 6 6" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></>,
    reset: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></>,
    book: <><path d="M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4zM12 6v15" /></>,
    person: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[name] || shapes.info}</svg>;
}

async function fetchJson(url, options, controller) {
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || 'ติดต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง');
    if (!data) throw new Error('ข้อมูลที่ได้รับไม่สมบูรณ์ กรุณาลองอีกครั้ง');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('ใช้เวลาเชื่อมต่อนานเกินไป กรุณาลองอีกครั้ง');
    if (error instanceof TypeError) throw new Error('เชื่อมต่อระบบไม่ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์กำลังทำงาน แล้วลองอีกครั้ง');
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function Answer({ message, ask, busy }) {
  const status = STATUS[message.status] || STATUS.clarification;
  const sources = Array.isArray(message.sources) ? message.sources.filter((source) => typeof source?.label === 'string') : [];
  const suggestions = Array.isArray(message.suggestions) ? message.suggestions.filter((item) => typeof item === 'string').slice(0, 3) : [];
  return <div className="message-row assistant-row"><div className="message-avatar"><Icon name="chat" size={17} /></div><div className="assistant-content"><span className="message-author">ผู้ช่วยตารางสอน</span><div className="answer-card"><span className={`answer-status ${status.className}`}><Icon name={status.icon} size={13} />{status.label}</span><p className="message-text">{message.text}</p>{sources.length > 0 && <details className="answer-sources"><summary><Icon name="book" size={13} />อ้างอิงตารางสอน · {sources.length} แหล่งข้อมูล<Icon name="chevron" size={12} /></summary><ul>{sources.map((source, index) => <li key={`${source.label}-${index}`}>{source.label}</li>)}</ul></details>}</div>{suggestions.length > 0 && <div className="suggestions">{suggestions.map((suggestion, index) => <button type="button" disabled={busy} key={`${suggestion}-${index}`} onClick={() => ask(suggestion)}>{suggestion}<Icon name="arrow" size={13} /></button>)}</div>}</div></div>;
}

export default function App() {
  const [schedule, setSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failedRequest, setFailedRequest] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const controllerRef = useRef(null);
  const activeRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setScheduleLoading(true);
    setScheduleError(null);
    fetchJson('/api/schedule', {}, controller).then((data) => {
      if (!data.meta || !Array.isArray(data.courses) || !data.weeklySchedule) throw new Error('รูปแบบข้อมูลตารางสอนไม่สมบูรณ์');
      if (!cancelled) setSchedule(data);
    }).catch((fetchError) => { if (!cancelled) setScheduleError(fetchError.message); })
      .finally(() => { if (!cancelled) setScheduleLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [reloadCount]);

  useEffect(() => {
    if (messages.length || loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  useEffect(() => () => { requestIdRef.current += 1; controllerRef.current?.abort(); }, []);

  async function sendMessage(value, retry = null) {
    const text = value.trim();
    if (!text || text.length > 1000 || activeRef.current) return;
    activeRef.current = true;
    const requestId = ++requestIdRef.current;
    const id = retry?.id || `user-${requestId}`;
    const history = retry?.history || messages.filter((message) => message.role === 'assistant' || message.delivery === 'sent').slice(-12).map(({ role, text: messageText }) => ({ role, text: messageText }));
    setMessages((previous) => retry ? previous.map((message) => message.id === id ? { ...message, delivery: 'pending' } : message) : [...previous, { id, role: 'user', text, delivery: 'pending' }]);
    setInput('');
    setLoading(true);
    setError(null);
    setFailedRequest(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const data = await fetchJson('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history }) }, controller);
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('ระบบยังไม่ได้ส่งคำตอบกลับมา กรุณาลองอีกครั้ง');
      if (requestId !== requestIdRef.current) return;
      setMessages((previous) => [...previous.map((message) => message.id === id ? { ...message, delivery: 'sent' } : message), { id: `answer-${requestId}`, role: 'assistant', text: data.reply, status: data.status, sources: data.sources, suggestions: data.suggestions }]);
    } catch (fetchError) {
      if (requestId !== requestIdRef.current) return;
      setMessages((previous) => previous.map((message) => message.id === id ? { ...message, delivery: 'failed' } : message));
      setError(fetchError.message);
      setFailedRequest({ id, text, history });
    } finally {
      if (requestId === requestIdRef.current) {
        activeRef.current = false;
        setLoading(false);
        controllerRef.current = null;
      }
    }
  }

  function clearConversation() {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    activeRef.current = false;
    setLoading(false);
    setMessages([]);
    setError(null);
    setFailedRequest(null);
    setInput('');
    inputRef.current?.focus();
  }

  return <div className="app-shell">
    <header className="site-header"><div className="brand"><span className="brand-mark"><Icon name="calendar" size={23} /></span><span>ตาราง<span className="brand-accent">คุย</span><small>SCHEDULE ASSISTANT</small></span></div><div className="header-right"><span className="header-semester">{schedule?.meta?.semester ? `ภาคเรียน ${schedule.meta.semester}` : 'ผู้ช่วยตารางสอน'}</span><span className={`connection-badge ${scheduleError ? 'offline' : ''}`}><span />{scheduleLoading ? 'กำลังเชื่อมต่อ' : scheduleError ? 'เชื่อมต่อไม่สำเร็จ' : 'เชื่อมต่อตารางแล้ว'}</span></div></header>
    <main className="workspace workspace-chat-only">
      <section className="chat-panel chat-panel-full" aria-label="สนทนากับผู้ช่วยตารางสอน">
        <div className="chat-header"><div className="chat-heading"><span className="chat-heading-icon"><Icon name="chat" size={22} /></span><div><h2>คุยเรื่องตารางสอน</h2><p><span className="small-dot" />ค้นจากตารางที่บันทึกไว้</p></div></div><button className="clear-button" type="button" onClick={clearConversation} disabled={!messages.length && !input} title="ล้างบทสนทนา" aria-label="ล้างบทสนทนาและเริ่มใหม่"><Icon name="reset" size={16} /><span>เริ่มใหม่</span></button></div>
        <div className="scope-notice"><Icon name="shield" size={16} /><p>หากเป็นเรื่องนอกตารางหรือไม่มีข้อมูล ผู้ช่วยจะบอกตรง ๆ ว่าตอบไม่ได้</p></div>
        <div className={`chat-messages ${messages.length ? 'has-messages' : ''}`} role="log" aria-label="ข้อความสนทนา" aria-live="polite" aria-relevant="additions">
          {!messages.length && <div className="welcome"><div className="welcome-icon"><Icon name="chat" size={30} /><span><Icon name="check" size={12} /></span></div><span className="welcome-eyebrow">ผู้ช่วยประจำตารางของคุณ</span><h3>วันนี้อยากรู้เรื่องอะไร?</h3><p>สวัสดีค่ะ ถามข้อมูลจากตารางสอนนี้ได้เลย<br />ฉันช่วยค้นวัน เวลา วิชา ห้อง และกลุ่มเรียนให้ค่ะ</p><div className="example-prompts"><span className="examples-label">ลองเริ่มจากคำถามเหล่านี้</span>{EXAMPLES.map((example, index) => <button type="button" key={example} disabled={loading} onClick={() => sendMessage(example)}><Icon name={['calendar', 'pin', 'clock'][index]} size={18} /><span>{example}</span><Icon name="arrow" size={16} /></button>)}</div><div className="welcome-footnote"><Icon name="book" size={13} />ทุกคำตอบที่พบข้อมูลมีแหล่งอ้างอิงให้ตรวจสอบ</div></div>}
          {messages.map((message) => message.role === 'user' ? <div className="message-row user-row" key={message.id}><div className="user-content"><span className="message-author">คุณ</span><p className="user-bubble message-text">{message.text}</p>{message.delivery === 'failed' && <span className="delivery-failed">ยังไม่ได้รับคำตอบ</span>}</div><div className="user-avatar"><Icon name="person" size={17} /></div></div> : <Answer key={message.id} message={message} ask={sendMessage} busy={loading} />)}
          {loading && <div className="message-row assistant-row"><div className="message-avatar"><Icon name="chat" size={17} /></div><div className="loading-message" role="status"><span className="typing-dots"><i /><i /><i /></span>กำลังค้นข้อมูลในตาราง…</div></div>}
          {error && <div className="chat-error" role="alert"><Icon name="info" size={18} /><div><p>{error}</p>{failedRequest && <button type="button" className="text-button" disabled={loading} onClick={() => sendMessage(failedRequest.text, failedRequest)}>ลองส่งอีกครั้ง<Icon name="reset" size={14} /></button>}</div></div>}
          <div ref={bottomRef} />
        </div>
        <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(input); }}><div className="input-wrap"><label className="sr-only" htmlFor="chat-input">คำถามเกี่ยวกับตารางสอน</label><textarea ref={inputRef} id="chat-input" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); sendMessage(input); } }} maxLength={1000} rows={2} placeholder="พิมพ์คำถามเกี่ยวกับตารางสอน…" disabled={loading} aria-describedby="input-help" /><button className="send-button" type="submit" disabled={loading || !input.trim()} aria-label="ส่งคำถาม">{loading ? <span className="loader" /> : <Icon name="send" size={23} />}</button></div><div className="composer-footer"><span id="input-help">Enter เพื่อส่ง <span className="desktop-input-hint">· Shift + Enter เพื่อขึ้นบรรทัดใหม่</span></span><span className={input.length >= 950 ? 'near-limit' : ''}>{input.length.toLocaleString()}/1,000</span></div></form>
      </section>
    </main>
  </div>;
}

