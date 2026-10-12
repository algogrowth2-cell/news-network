'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { authFetch } from '@/lib/phoneAuth';
import { uploadToS3, compressToBlob } from '@/lib/s3Upload';

const CATS = ['दुर्घटना', 'अपराध', 'राजनीति', 'समाज', 'खेल', 'शिक्षा', 'स्वास्थ्य', 'मौसम', 'भ्रष्टाचार', 'अन्य'];
const MAX_PHOTOS = 6;
const MAX_VIDEOS = 2;
const MAX_VIDEO_MB = 60;

const CSS = `
.jd{min-height:100vh;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;color:#0f172a}
.jd-hero{background:linear-gradient(135deg,#ea580c,#c2410c);color:#fff;padding:34px 16px 30px}
.jd-wrap{max-width:760px;margin:0 auto;padding:0 16px}
.jd-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.18);border-radius:30px;padding:6px 14px;font-size:13px;font-weight:700}
.jd-h1{font-size:28px;font-weight:800;margin:14px 0 8px}
.jd-sub{font-size:15px;opacity:.95;line-height:1.6;margin:0}
.jd-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:22px;margin-top:18px;box-shadow:0 2px 14px rgba(2,6,23,.05)}
.jd-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px}
.jd-step{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px}
.jd-step .n{width:28px;height:28px;border-radius:50%;background:#ea580c;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px}
.jd-step h4{margin:10px 0 4px;font-size:14px}
.jd-step p{margin:0;font-size:12.5px;color:#64748b;line-height:1.5}
.jd-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#ea580c;color:#fff;border:none;border-radius:10px;padding:13px 26px;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none}
.jd-btn:disabled{opacity:.6;cursor:not-allowed}
.jd-btn.ghost{background:#fff;color:#ea580c;border:1.5px solid #ea580c}
.jd-label{display:block;font-size:13.5px;font-weight:700;color:#334155;margin:0 0 6px}
.jd-in,.jd-ta,.jd-sel{width:100%;padding:12px 14px;border-radius:10px;border:1px solid #cbd5e1;font-size:14.5px;outline:none;box-sizing:border-box;background:#fff}
.jd-ta{resize:vertical;line-height:1.6}
.jd-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.jd-field{margin-bottom:16px}
.jd-drop{border:2px dashed #fdba74;border-radius:12px;background:#fff7ed;padding:16px;text-align:center;cursor:pointer;display:block}
.jd-drop span{color:#c2410c;font-weight:700;font-size:14px}
.jd-drop small{display:block;color:#94a3b8;font-size:12px;margin-top:4px}
.jd-thumbs{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.jd-thumb{position:relative;width:88px;height:88px;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;background:#000}
.jd-thumb img,.jd-thumb video{width:100%;height:100%;object-fit:cover}
.jd-x{position:absolute;top:3px;right:3px;width:22px;height:22px;border-radius:50%;background:rgba(2,6,23,.75);color:#fff;border:none;cursor:pointer;font-size:13px;line-height:1}
.jd-note{font-size:12.5px;color:#64748b;margin:6px 0 0}
.jd-msg{padding:12px 14px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:14px}
.jd-ok{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}
.jd-err{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}
.jd-chips{display:flex;flex-wrap:wrap;gap:8px}
.jd-chip{border:1px solid #cbd5e1;background:#fff;border-radius:20px;padding:7px 14px;font-size:13px;cursor:pointer;color:#334155}
.jd-chip.on{background:#ea580c;color:#fff;border-color:#ea580c}
@media(max-width:560px){.jd-row{grid-template-columns:1fr}.jd-steps{grid-template-columns:1fr}.jd-h1{font-size:23px}}
`;

interface Media { url: string; type: 'image' | 'video' }

function JantaDarbaar() {
  const sp = useSearchParams();
  const router = useRouter();
  const site = sp.get('site') || 'the-local-leader';
  const [user, setUser] = useState<{ name?: string; phone?: string } | null>(null);
  const [ready, setReady] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('reader_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const photos = media.filter((m) => m.type === 'image');
  const videos = media.filter((m) => m.type === 'video');

  const addFiles = async (files: FileList | null, kind: 'image' | 'video') => {
    if (!files?.length) return;
    setMsg(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (kind === 'image' && photos.length + 1 > MAX_PHOTOS) { setMsg({ t: `ज़्यादा से ज़्यादा ${MAX_PHOTOS} फोटो।`, ok: false }); break; }
        if (kind === 'video') {
          if (videos.length + 1 > MAX_VIDEOS) { setMsg({ t: `ज़्यादा से ज़्यादा ${MAX_VIDEOS} वीडियो।`, ok: false }); break; }
          if (file.size > MAX_VIDEO_MB * 1024 * 1024) { setMsg({ t: `वीडियो ${MAX_VIDEO_MB}MB से छोटा होना चाहिए।`, ok: false }); continue; }
        }
        const blob = kind === 'image' ? await compressToBlob(file, 1600, 0.85) : file;
        const url = await uploadToS3(blob, 'janta');
        if (!url) { setMsg({ t: 'अपलोड अभी उपलब्ध नहीं (S3)।', ok: false }); break; }
        setMedia((m) => [...m, { url, type: kind }]);
      }
    } catch (e: any) {
      setMsg({ t: 'फ़ाइल अपलोड नहीं हुई: ' + (e?.message || ''), ok: false });
    }
    setUploading(false);
  };

  const removeMedia = (url: string) => setMedia((m) => m.filter((x) => x.url !== url));

  const submit = async () => {
    setMsg(null);
    if (title.trim().length < 5) return setMsg({ t: 'कृपया शीर्षक (कम से कम 5 अक्षर) लिखें।', ok: false });
    if (description.trim().length < 10) return setMsg({ t: 'कृपया खबर के बारे में थोड़ा विवरण लिखें।', ok: false });
    setSaving(true);
    try {
      const r = await authFetch('/api/janta/submit', {
        method: 'POST',
        body: JSON.stringify({
          title, description, category, location, city, state, site,
          name: user?.name,
          photos: photos.map((p) => p.url),
          videos: videos.map((v) => v.url)
        })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message || 'जमा नहीं हो पाई।');
      setMsg({ t: '✓ आपकी खबर समीक्षा के लिए भेज दी गई है। हमारी टीम सत्यापित करके इसे वेबसाइट पर प्रकाशित करेगी। धन्यवाद!', ok: true });
      setTitle(''); setDescription(''); setCategory(''); setLocation(''); setCity(''); setState(''); setMedia([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setMsg({ t: e?.message || 'कुछ गड़बड़ हुई।', ok: false });
    }
    setSaving(false);
  };

  if (!ready) return <div className="jd"><div className="jd-wrap" style={{ padding: '60px 16px', textAlign: 'center', color: '#64748b' }}>लोड हो रहा है...</div></div>;

  return (
    <div className="jd">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="jd-hero">
        <div className="jd-wrap">
          <span className="jd-badge">📢 जनता दरबार</span>
          <h1 className="jd-h1">आपके आस-पास की खबर, अब आपकी ज़ुबानी</h1>
          <p className="jd-sub">
            आपने कुछ देखा — कोई घटना, समस्या, या कोई अच्छी खबर? सीधे हमें भेजिए। फोटो और वीडियो के साथ।
            हमारी टीम सत्यापित करके उसे वेबसाइट पर प्रकाशित करेगी।
          </p>
        </div>
      </div>

      <div className="jd-wrap" style={{ paddingBottom: 50 }}>
        {!user ? (
          // ---------- Logged-out: jaankari + login ----------
          <>
            <div className="jd-card">
              <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>जनता दरबार क्या है?</h3>
              <p style={{ margin: 0, color: '#475569', fontSize: 14.5, lineHeight: 1.7 }}>
                जनता दरबार एक <b>नागरिक पत्रकारिता</b> मंच है। यहाँ कोई भी आम नागरिक अपने इलाके की खबर,
                घटना या समस्या — फोटो और वीडियो के साथ — सीधे हमारे पास भेज सकता है। हमारी संपादकीय टीम
                हर खबर की <b>जाँच करती है</b>, और सही पाए जाने पर उसे वेबसाइट पर <b>आपके नाम के साथ</b> प्रकाशित किया जाता है।
              </p>
              <div className="jd-steps">
                <div className="jd-step"><div className="n">1</div><h4>खबर लिखें</h4><p>क्या, कहाँ और कब हुआ — संक्षेप में बताएं।</p></div>
                <div className="jd-step"><div className="n">2</div><h4>फोटो/वीडियो</h4><p>अपने फ़ोन से सीधे फोटो या वीडियो जोड़ें।</p></div>
                <div className="jd-step"><div className="n">3</div><h4>प्रकाशन</h4><p>टीम सत्यापन के बाद खबर लाइव कर देगी।</p></div>
              </div>
            </div>

            <div className="jd-card" style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 17 }}>खबर भेजने के लिए लॉगिन करें</h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 14 }}>
                सुरक्षा और भरोसे के लिए खबर सिर्फ़ लॉगिन किए हुए उपयोगकर्ता ही भेज सकते हैं। एक मिनट में मोबाइल OTP से लॉगिन/साइनअप करें।
              </p>
              <Link href={`/login?redirect=${encodeURIComponent('/janta-darbaar?site=' + site)}`} className="jd-btn">
                लॉगिन / साइनअप →
              </Link>
            </div>
          </>
        ) : (
          // ---------- Logged-in: form ----------
          <div className="jd-card">
            {msg && <div className={`jd-msg ${msg.ok ? 'jd-ok' : 'jd-err'}`}>{msg.t}</div>}

            <div className="jd-field">
              <label className="jd-label">शीर्षक *</label>
              <input className="jd-in" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="खबर का शीर्षक, जैसे: मुख्य सड़क पर गड्ढों से परेशानी" maxLength={160} />
            </div>

            <div className="jd-field">
              <label className="jd-label">खबर का विवरण *</label>
              <textarea className="jd-ta" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="क्या हुआ, कहाँ हुआ, कब हुआ — अपनी भाषा में विस्तार से लिखें..." maxLength={6000} />
            </div>

            <div className="jd-field">
              <label className="jd-label">श्रेणी</label>
              <div className="jd-chips">
                {CATS.map((c) => (
                  <button key={c} type="button" className={`jd-chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(category === c ? '' : c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className="jd-field">
              <div className="jd-row">
                <div><label className="jd-label">स्थान</label><input className="jd-in" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="मोहल्ला/जगह" /></div>
                <div><label className="jd-label">शहर</label><input className="jd-in" value={city} onChange={(e) => setCity(e.target.value)} placeholder="शहर" /></div>
                <div><label className="jd-label">राज्य</label><input className="jd-in" value={state} onChange={(e) => setState(e.target.value)} placeholder="राज्य" /></div>
              </div>
            </div>

            <div className="jd-field">
              <label className="jd-label">फोटो जोड़ें ({photos.length}/{MAX_PHOTOS})</label>
              <label className="jd-drop">
                <span>📷 फ़ोन से फोटो चुनें</span>
                <small>एक साथ कई फोटो चुन सकते हैं</small>
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files, 'image'); e.currentTarget.value = ''; }} />
              </label>
            </div>

            <div className="jd-field">
              <label className="jd-label">वीडियो जोड़ें ({videos.length}/{MAX_VIDEOS})</label>
              <label className="jd-drop">
                <span>🎥 फ़ोन से वीडियो चुनें</span>
                <small>हर वीडियो {MAX_VIDEO_MB}MB तक</small>
                <input type="file" accept="video/*" multiple hidden onChange={(e) => { addFiles(e.target.files, 'video'); e.currentTarget.value = ''; }} />
              </label>
            </div>

            {uploading && <p className="jd-note">⏳ फ़ाइल अपलोड हो रही है...</p>}

            {media.length > 0 && (
              <div className="jd-thumbs">
                {media.map((m) => (
                  <div className="jd-thumb" key={m.url}>
                    {m.type === 'image' ? <img src={m.url} alt="" /> : <video src={m.url} muted />}
                    <button className="jd-x" type="button" onClick={() => removeMedia(m.url)} aria-label="हटाएं">×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 22, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="jd-btn" disabled={saving || uploading} onClick={submit}>
                {saving ? 'भेजा जा रहा है...' : 'खबर जमा करें'}
              </button>
              <button className="jd-btn ghost" type="button" onClick={() => router.push('/')}>होम पर जाएं</button>
              <span className="jd-note" style={{ marginLeft: 'auto' }}>भेजने वाला: {user.name || 'नागरिक'}</span>
            </div>
            <p className="jd-note" style={{ marginTop: 14 }}>
              नोट: आपकी खबर सीधे वेबसाइट पर नहीं जाती। हमारी टीम उसे सत्यापित करने के बाद ही प्रकाशित करती है।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="jd" />}>
      <JantaDarbaar />
    </Suspense>
  );
}
