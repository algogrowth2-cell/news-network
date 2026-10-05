'use client';
import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NETWORK_SITES } from '@/lib/portals';
import { fallbackFor } from '@/lib/siteTheme';
import {
  createNotification,
  notifIcon,
  NOTIF_TYPES,
  parseNotification,
  timeAgoHi,
  type NotificationItem,
  type NotifPriority,
  type NotifType
} from '@/lib/notifications';
import styles from '../Admin.module.css';

const CSS = `
.nt-grid{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:22px;align-items:start}
@media(max-width:1100px){.nt-grid{grid-template-columns:1fr}}
.nt-card{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:12px;padding:18px}
.nt-label{display:block;font-size:12px;font-weight:600;color:var(--fg-cbd5e1);margin-bottom:6px}
.nt-in{width:100%;box-sizing:border-box;padding:10px 12px;background:var(--bg-020617);border:1px solid var(--bd-334155);border-radius:7px;color:var(--fg-fff);font-size:14px;outline:none;font-family:inherit}
.nt-hint{font-size:11px;color:var(--fg-64748b);margin-top:4px}
.nt-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:700px){.nt-row{grid-template-columns:1fr}}
.nt-seg{display:flex;gap:4px;background:var(--bg-020617);border:1px solid var(--bd-334155);border-radius:8px;padding:3px}
.nt-seg button{flex:1;border:0;border-radius:6px;padding:8px 6px;font-size:12.5px;cursor:pointer;background:transparent;color:var(--fg-94a3b8);font-family:inherit}
.nt-seg button.on{color:#fff;font-weight:700}
.nt-portal{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--bd-334155);border-radius:16px;padding:5px 11px;font-size:12.5px;cursor:pointer;margin:0 6px 6px 0}
.nt-portal.on{border-color:#2563eb;background:rgba(37,99,235,.12)}
.nt-portal input{accent-color:#2563eb}
.nt-item{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--bd-1e293b)}
.nt-item:last-child{border-bottom:0}
.nt-ic{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font-size:18px;flex-shrink:0;background:var(--bg-1e293b)}
.nt-pill{display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:10px;margin-right:5px}
.nt-btn{background:transparent;border:1px solid var(--bd-334155);color:var(--fg-cbd5e1);border-radius:6px;padding:4px 9px;font-size:12px;cursor:pointer;font-family:inherit;margin-right:5px}
.nt-btn.danger{border-color:#ef4444;color:var(--fg-f87171)}
.nt-err{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.45);color:var(--fg-fca5a5);border-radius:8px;padding:10px 12px;font-size:13px;margin-bottom:12px}
.nt-ok{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.4);color:var(--fg-6ee7b7);border-radius:8px;padding:10px 12px;font-size:13px;margin-bottom:12px}
.nt-preview{background:#fff;color:#0f172a;border-radius:12px;padding:14px;box-shadow:0 8px 24px rgba(0,0,0,.18);display:flex;gap:12px}
.nt-tab{background:transparent;border:1px solid var(--bd-334155);color:var(--fg-94a3b8);border-radius:7px;padding:6px 12px;font-size:12.5px;cursor:pointer;font-family:inherit}
.nt-tab.on{background:#ea580c;border-color:#ea580c;color:#fff}
`;

const PRIORITY: { value: NotifPriority; label: string; color: string; hint: string }[] = [
  { value: 'normal', label: 'सामान्य', color: '#2563eb', hint: 'सिर्फ 🔔 लिस्ट में' },
  { value: 'important', label: 'महत्वपूर्ण', color: '#d97706', hint: '🔔 लिस्ट + वेबसाइट खुलते ही पॉप-अप' },
  { value: 'urgent', label: 'अति आवश्यक', color: '#dc2626', hint: 'पॉप-अप + लाल हाइलाइट, बंद करने तक दिखता है' }
];
const priorityOf = (p: string) => PRIORITY.find((x) => x.value === p) || PRIORITY[0];

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin' | 'auto' | 'off'>('all');

  // Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [image, setImage] = useState('');
  const [type, setType] = useState<NotifType>('announcement');
  const [priority, setPriority] = useState<NotifPriority>('normal');
  const [portals, setPortals] = useState<string[]>([]);
  const [audience, setAudience] = useState<'all' | 'logged-in'>('all');
  const [when, setWhen] = useState<'now' | 'later'>('now');
  const [publishAt, setPublishAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(200)),
      (snap) => {
        setItems(snap.docs.map((d) => parseNotification(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError('Notifications लोड नहीं हुए: ' + err.message);
        setLoading(false);
      }
    );
  }, []);

  const allSelected = portals.length === 0 || portals.length === NETWORK_SITES.length;

  const send = async () => {
    setError('');
    setNotice('');
    if (title.trim().length < 3) return setError('कृपया नोटिफिकेशन का शीर्षक लिखें।');
    if (link && !/^(https?:\/\/|\/)/.test(link.trim())) return setError('लिंक https:// या / से शुरू होना चाहिए (जैसे /epaper)।');
    if (image && !/^https:\/\//.test(image.trim())) return setError('फ़ोटो URL https:// से शुरू होना चाहिए।');
    const pubDate = when === 'later' ? new Date(publishAt) : null;
    if (when === 'later' && (!publishAt || Number.isNaN(pubDate!.getTime()) || pubDate!.getTime() < Date.now())) return setError('भेजने का सही भविष्य का समय चुनें।');
    const expDate = expiresAt ? new Date(expiresAt) : null;
    if (expDate && expDate.getTime() <= (pubDate?.getTime() || Date.now())) return setError('समाप्ति का समय भेजने के समय के बाद का होना चाहिए।');

    setSending(true);
    try {
      await createNotification({
        title,
        message,
        link: link.trim(),
        image: image.trim(),
        type,
        priority,
        portals: allSelected ? [] : portals,
        audience,
        publishAt: pubDate,
        expiresAt: expDate,
        source: 'admin'
      });
      const where = allSelected ? 'सभी पोर्टल' : portals.map((p) => fallbackFor(p).name).join(', ');
      setNotice(when === 'later' ? `⏰ नोटिफिकेशन शेड्यूल हो गया — ${pubDate!.toLocaleString('hi-IN')} पर ${where} पर जाएगा।` : `✅ नोटिफिकेशन भेज दिया गया — ${where}`);
      setTitle('');
      setMessage('');
      setLink('');
      setImage('');
      setPriority('normal');
      setWhen('now');
      setPublishAt('');
      setExpiresAt('');
    } catch (err: any) {
      setError('भेजा नहीं जा सका: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const toggle = (n: NotificationItem) => updateDoc(doc(db, 'notifications', n.id), { active: !n.active, updatedAt: serverTimestamp() }).catch((e) => setError(e.message));
  const remove = async (n: NotificationItem) => {
    if (!window.confirm(`"${n.title}" नोटिफिकेशन हमेशा के लिए हटाएं?`)) return;
    await deleteDoc(doc(db, 'notifications', n.id)).catch((e) => setError(e.message));
  };

  const visible = useMemo(
    () => items.filter((n) => (filter === 'all' ? true : filter === 'off' ? !n.active : n.source === filter && n.active)),
    [items, filter]
  );
  const now = Date.now();
  const stats = {
    live: items.filter((n) => n.active && (!n.publishAt || n.publishAt.getTime() <= now) && (!n.expiresAt || n.expiresAt.getTime() > now)).length,
    scheduled: items.filter((n) => n.active && n.publishAt && n.publishAt.getTime() > now).length,
    auto: items.filter((n) => n.source === 'auto').length
  };
  const p = priorityOf(priority);

  return (
    <div style={{ color: 'var(--fg-fff)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>🔔 Notifications</h1>
        <p style={{ fontSize: '13px', color: 'var(--fg-94a3b8)' }}>
          पोर्टल चुनकर ज़रूरी सूचना भेजें। नई खबर, वीडियो, लाइव और ई-पेपर डालने पर नोटिफिकेशन अपने-आप भी जाते हैं — पाठकों को वेबसाइट की 🔔 घंटी में दिखते हैं।
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {[
          ['अभी लाइव', stats.live, '#10b981'],
          ['शेड्यूल', stats.scheduled, '#8b5cf6'],
          ['अपने-आप बने', stats.auto, '#0ea5e9'],
          ['कुल', items.length, '#ea580c']
        ].map(([l, v, c]) => (
          <div key={l as string} className="nt-card" style={{ padding: '12px 16px', minWidth: '140px' }}>
            <div style={{ fontSize: '12px', color: 'var(--fg-94a3b8)', fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: c as string }}>{v as number}</div>
          </div>
        ))}
      </div>

      <div className="nt-grid">
        {/* Compose */}
        <div className="nt-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>नया नोटिफिकेशन भेजें</h3>
          {error && <div className="nt-err">⚠️ {error}</div>}
          {notice && <div className="nt-ok">{notice}</div>}

          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label className="nt-label">शीर्षक *</label>
              <input className="nt-in" value={title} maxLength={140} placeholder="जैसे: कल सुबह 10 बजे विशेष लाइव कवरेज" onChange={(e) => setTitle(e.target.value)} />
              <div className="nt-hint">{title.length}/140</div>
            </div>
            <div>
              <label className="nt-label">संदेश</label>
              <textarea className="nt-in" rows={3} value={message} maxLength={400} style={{ resize: 'vertical' }} placeholder="विस्तार से जानकारी (वैकल्पिक)…" onChange={(e) => setMessage(e.target.value)} />
            </div>
            <div className="nt-row">
              <div>
                <label className="nt-label">क्लिक करने पर कहाँ जाएं (लिंक)</label>
                <input className="nt-in" value={link} placeholder="/epaper या https://…" onChange={(e) => setLink(e.target.value)} />
              </div>
              <div>
                <label className="nt-label">फ़ोटो URL (वैकल्पिक)</label>
                <input className="nt-in" value={image} placeholder="https://…" onChange={(e) => setImage(e.target.value)} />
              </div>
            </div>
            <div className="nt-row">
              <div>
                <label className="nt-label">प्रकार</label>
                <select className="nt-in" value={type} onChange={(e) => setType(e.target.value as NotifType)}>
                  {NOTIF_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="nt-label">किसे दिखे</label>
                <select className="nt-in" value={audience} onChange={(e) => setAudience(e.target.value as 'all' | 'logged-in')}>
                  <option value="all">सभी विज़िटर</option>
                  <option value="logged-in">सिर्फ लॉगिन पाठक</option>
                </select>
              </div>
            </div>

            <div>
              <label className="nt-label">महत्व</label>
              <div className="nt-seg">
                {PRIORITY.map((x) => (
                  <button key={x.value} type="button" className={priority === x.value ? 'on' : ''} style={priority === x.value ? { background: x.color } : undefined} onClick={() => setPriority(x.value)}>
                    {x.label}
                  </button>
                ))}
              </div>
              <div className="nt-hint">{p.hint}</div>
            </div>

            <div>
              <label className="nt-label">किन पोर्टल्स पर भेजें</label>
              <label className={`nt-portal ${allSelected ? 'on' : ''}`}>
                <input type="checkbox" checked={allSelected} onChange={() => setPortals(allSelected ? [NETWORK_SITES[0].slug] : [])} /> 🌐 सभी पोर्टल
              </label>
              {NETWORK_SITES.map((s) => {
                const on = !allSelected && portals.includes(s.slug);
                return (
                  <label key={s.slug} className={`nt-portal ${on ? 'on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => {
                        const base = allSelected ? [] : portals;
                        const next = on ? base.filter((x) => x !== s.slug) : [...base, s.slug];
                        setPortals(next.length === NETWORK_SITES.length ? [] : next);
                      }}
                    />
                    {fallbackFor(s.slug).name}
                  </label>
                );
              })}
            </div>

            <div className="nt-row">
              <div>
                <label className="nt-label">कब भेजें</label>
                <div className="nt-seg">
                  <button type="button" className={when === 'now' ? 'on' : ''} style={when === 'now' ? { background: '#2563eb' } : undefined} onClick={() => setWhen('now')}>
                    अभी
                  </button>
                  <button
                    type="button"
                    className={when === 'later' ? 'on' : ''}
                    style={when === 'later' ? { background: '#7c3aed' } : undefined}
                    onClick={() => {
                      setWhen('later');
                      if (!publishAt) setPublishAt(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
                    }}
                  >
                    ⏰ बाद में
                  </button>
                </div>
                {when === 'later' && <input className="nt-in" type="datetime-local" style={{ marginTop: '8px' }} value={publishAt} min={toLocalInput(new Date())} onChange={(e) => setPublishAt(e.target.value)} />}
              </div>
              <div>
                <label className="nt-label">कब तक दिखे (वैकल्पिक)</label>
                <input className="nt-in" type="datetime-local" value={expiresAt} min={toLocalInput(new Date())} onChange={(e) => setExpiresAt(e.target.value)} />
                <div className="nt-hint">खाली = हमेशा (जब तक हटाएं नहीं)</div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="nt-label">पाठक को ऐसा दिखेगा</label>
              <div className="nt-preview" style={{ borderLeft: `4px solid ${p.color}` }}>
                <div style={{ fontSize: '22px' }}>{notifIcon(type)}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{title || 'नोटिफिकेशन का शीर्षक'}</div>
                  {message && <div style={{ fontSize: '13px', color: '#475569', marginTop: '3px' }}>{message}</div>}
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '5px' }}>अभी {link ? '· खोलें →' : ''}</div>
                </div>
              </div>
            </div>

            <button className={styles.btnPrimary} onClick={send} disabled={sending} style={{ justifySelf: 'start', padding: '10px 20px' }}>
              {sending ? 'भेजा जा रहा है…' : when === 'later' ? '⏰ शेड्यूल करें' : '🔔 नोटिफिकेशन भेजें'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="nt-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>भेजे गए</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              {(
                [
                  ['all', 'सभी'],
                  ['admin', 'एडमिन'],
                  ['auto', 'अपने-आप'],
                  ['off', 'बंद']
                ] as const
              ).map(([k, l]) => (
                <button key={k} className={`nt-tab ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--fg-94a3b8)' }}>लोड हो रहा है…</div>
          ) : visible.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--fg-94a3b8)', fontSize: '13px' }}>कोई नोटिफिकेशन नहीं</div>
          ) : (
            <div style={{ maxHeight: '820px', overflowY: 'auto' }}>
              {visible.map((n) => {
                const pr = priorityOf(n.priority);
                const scheduled = n.publishAt && n.publishAt.getTime() > now;
                const expired = n.expiresAt && n.expiresAt.getTime() < now;
                return (
                  <div key={n.id} className="nt-item" style={{ opacity: n.active && !expired ? 1 : 0.5 }}>
                    <div className="nt-ic">{notifIcon(n.type)}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', wordBreak: 'break-word' }}>{n.title}</div>
                      {n.message && <div style={{ fontSize: '12.5px', color: 'var(--fg-94a3b8)', marginTop: '2px' }}>{n.message.slice(0, 120)}</div>}
                      <div style={{ marginTop: '6px' }}>
                        {n.priority !== 'normal' && (
                          <span className="nt-pill" style={{ background: pr.color, color: '#fff' }}>
                            {pr.label}
                          </span>
                        )}
                        <span className="nt-pill" style={{ background: 'var(--bg-1e293b)', color: 'var(--fg-cbd5e1)' }}>
                          {n.source === 'auto' ? '⚙️ अपने-आप' : '👤 एडमिन'}
                        </span>
                        {scheduled && (
                          <span className="nt-pill" style={{ background: 'var(--bg-3b0764)', color: 'var(--fg-d8b4fe)' }}>
                            ⏰ {n.publishAt!.toLocaleString('hi-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {expired && <span className="nt-pill" style={{ background: 'var(--bg-451a03)', color: 'var(--fg-fbbf24)' }}>समाप्त</span>}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--fg-64748b)', marginTop: '5px' }}>
                        {n.portals.length ? n.portals.map((s) => fallbackFor(s).name).join(', ') : 'सभी पोर्टल'} · {n.audience === 'logged-in' ? 'लॉगिन पाठक' : 'सभी'} ·{' '}
                        {scheduled ? 'शेड्यूल' : timeAgoHi(n.publishAt)}
                      </div>
                      <div style={{ marginTop: '7px' }}>
                        <button className="nt-btn" onClick={() => toggle(n)}>
                          {n.active ? 'बंद करें' : 'चालू करें'}
                        </button>
                        <button className="nt-btn danger" onClick={() => remove(n)}>
                          🗑 हटाएं
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
