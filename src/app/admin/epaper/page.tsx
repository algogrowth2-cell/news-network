'use client';
import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { notifyContent, portalsFrom } from '@/lib/notifications';
import { NETWORK_SITES } from '@/lib/portals';
import { hasEpaper } from '@/lib/epaperSub';
import styles from '../Admin.module.css';

interface EPaperDoc {
  id: string;
  siteId: string;
  date: string;
  cityName: string;
  editionName: string;
  status: string;
  pdfUrl: string;
  thumbnailUrl: string;
  pdfStoragePath?: string;
  thumbStoragePath?: string;
  totalPages?: number;
  createdAt?: any;
}

type SourceMode = 'upload' | 'url';

interface UploadState {
  progress: number;
  uploading: boolean;
  fileName: string;
  storagePath: string;
  error: string;
  url: string;
}

const EMPTY_UPLOAD: UploadState = { progress: 0, uploading: false, fileName: '', storagePath: '', error: '', url: '' };

// E-paper sirf in 4 portals par (Jan Bharat / NDN / Desh Ki Aawaz / NEWS INFO 24 par nahi)
const SITE_OPTIONS = [{ slug: 'all', name: 'सभी ई-पेपर पोर्टल (All E-Paper Portals)' }, ...NETWORK_SITES.filter((x) => hasEpaper(x.slug))];

const siteName = (slug: string) => SITE_OPTIONS.find((s) => s.slug === slug)?.name || slug;

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatBytes = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

const EP_STYLES = `
.ea-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ea-tabs{display:inline-flex;background:var(--bg-0b1120);border:1px solid var(--bd-1e293b);border-radius:9px;padding:3px;margin-bottom:10px}
.ea-tab{background:none;border:0;color:var(--fg-94a3b8);padding:6px 14px;border-radius:7px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit}
.ea-tab.on{background:var(--bg-1e293b);color:var(--fg-fff)}
.ea-drop{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border:1.5px dashed var(--bd-334155);border-radius:10px;padding:14px;background:var(--bg-0b1120)}
.ea-file-btn{background:var(--bg-1e293b);border:1px solid var(--bd-334155);color:var(--fg-e2e8f0);padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.ea-file-btn:disabled{opacity:.5;cursor:not-allowed}
.ea-hint{font-size:12px;color:#64748b}
.ea-bar{height:8px;background:var(--bg-1e293b);border-radius:99px;overflow:hidden;margin-top:10px}
.ea-bar-fill{height:100%;background:#2563eb;transition:width .2s ease}
.ea-bar-fill.done{background:#10b981}
.ea-status{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:var(--fg-94a3b8);margin-top:6px}
.ea-err{font-size:12.5px;color:var(--fg-fca5a5);margin-top:8px}
.ea-ok{font-size:12.5px;color:var(--fg-6ee7b7);margin-top:8px;word-break:break-all}
.ea-cancel{background:none;border:0;color:var(--fg-fca5a5);font-size:12px;cursor:pointer;padding:0;font-family:inherit}
.ea-thumb-preview{width:90px;aspect-ratio:3/4;object-fit:cover;border-radius:6px;border:1px solid var(--bd-334155);background:var(--bg-0b1120)}
.ea-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.ea-card{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:12px;padding:12px;display:flex;gap:12px}
.ea-card img{width:70px;aspect-ratio:3/4;object-fit:cover;border-radius:6px;background:var(--bg-1e293b);flex-shrink:0}
.ea-card-body{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px;font-size:12.5px;color:var(--fg-94a3b8)}
.ea-card-title{font-size:14px;font-weight:700;color:var(--fg-fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ea-pill{display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;width:fit-content}
.ea-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:auto;padding-top:6px}
.ea-act{background:var(--bg-1e293b);border:1px solid var(--bd-334155);color:var(--fg-e2e8f0);font-size:11.5px;padding:4px 9px;border-radius:6px;cursor:pointer;text-decoration:none;font-family:inherit}
.ea-act.danger{color:var(--fg-fca5a5);border-color:var(--bd-7f1d1d)}
@media(max-width:700px){.ea-grid{grid-template-columns:1fr}}
`;

export default function EPaperPage() {
  const [editions, setEditions] = useState<EPaperDoc[]>([]);
  const [siteFilter, setSiteFilter] = useState('all-list');

  const [siteId, setSiteId] = useState('the-local-leader');
  const [date, setDate] = useState(todayISO());
  const [cityName, setCityName] = useState('');
  const [editionName, setEditionName] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [status, setStatus] = useState('published');

  const [pdfMode, setPdfMode] = useState<SourceMode>('upload');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfUpload, setPdfUpload] = useState<UploadState>(EMPTY_UPLOAD);

  const [thumbMode, setThumbMode] = useState<SourceMode>('upload');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbUpload, setThumbUpload] = useState<UploadState>(EMPTY_UPLOAD);

  const [saving, setSaving] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const pdfTaskRef = useRef<UploadTask | null>(null);
  const thumbTaskRef = useRef<UploadTask | null>(null);

  // Live listener: 'epaper' collection (public /epaper page bhi yahi padhta hai)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'epaper'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EPaperDoc));
        list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        setEditions(list);
      },
      (err) => console.error('E-Paper listener error:', err)
    );
    return () => unsub();
  }, []);

  // Page khulte hi: purane editions surakshit (PDF link private, public download token band) — idempotent
  const secureEditions = () =>
    fetch('/api/admin/epaper-secure', { method: 'POST', credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => r && (r.moved || r.revoked) && console.info('E-paper secured:', r))
      .catch(() => {});
  useEffect(() => {
    secureEditions();
  }, []);

  // Admin preview: signed link (admin session cookie)
  const openPdf = async (ed: EPaperDoc) => {
    const res = await fetch(`/api/epaper/file?id=${encodeURIComponent(ed.id)}`, { credentials: 'same-origin' });
    if (res.status === 503 && ed.pdfUrl) return window.open(ed.pdfUrl, '_blank', 'noopener,noreferrer');
    const data = await res.json().catch(() => ({}));
    if (data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
    else alert(data.message || 'PDF नहीं मिली।');
  };

  // Desktop se chuni file ko Firebase Storage (epapers/...) me upload karta hai, progress ke saath
  const startUpload = (
    file: File,
    kind: 'pdf' | 'thumb',
    setState: React.Dispatch<React.SetStateAction<UploadState>>,
    setUrl: (url: string) => void,
    taskRef: React.RefObject<UploadTask | null>
  ) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folder = kind === 'pdf' ? 'pdf' : 'thumbnails';
    const storagePath = `epapers/${siteId}/${date || todayISO()}/${folder}/${Date.now()}-${safeName}`;

    setUrl('');
    setState({ ...EMPTY_UPLOAD, uploading: true, fileName: `${file.name} (${formatBytes(file.size)})`, storagePath });

    const task = uploadBytesResumable(ref(storage, storagePath), file, { contentType: file.type });
    taskRef.current = task;

    task.on(
      'state_changed',
      (snap) => {
        const pct = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
        setState((s) => ({ ...s, progress: pct }));
      },
      (err) => {
        taskRef.current = null;
        const msg =
          err.code === 'storage/canceled'
            ? 'Upload cancel kar diya gaya.'
            : err.code === 'storage/unauthorized'
              ? 'Upload ki permission nahi hai (Firebase Storage rules check karein).'
              : `Upload fail: ${err.message}`;
        setState((s) => ({ ...s, uploading: false, error: msg, storagePath: '' }));
      },
      async () => {
        taskRef.current = null;
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          setUrl(url);
          setState((s) => ({ ...s, uploading: false, progress: 100, url }));
        } catch (err: any) {
          setState((s) => ({ ...s, uploading: false, error: `Download URL nahi mila: ${err.message}` }));
        }
      }
    );
  };

  const handlePdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfUpload({ ...EMPTY_UPLOAD, error: 'Sirf PDF file chunein.' });
      return;
    }
    startUpload(file, 'pdf', setPdfUpload, setPdfUrl, pdfTaskRef);
  };

  const handleThumbFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setThumbUpload({ ...EMPTY_UPLOAD, error: 'Sirf image file (JPG/PNG/WebP) chunein.' });
      return;
    }
    startUpload(file, 'thumb', setThumbUpload, setThumbnailUrl, thumbTaskRef);
  };

  const resetForm = () => {
    setCityName('');
    setEditionName('');
    setTotalPages('');
    setPdfUrl('');
    setThumbnailUrl('');
    setPdfUpload(EMPTY_UPLOAD);
    setThumbUpload(EMPTY_UPLOAD);
  };

  const isUploading = pdfUpload.uploading || thumbUpload.uploading;

  const handleSave = async () => {
    if (isUploading) return;
    const finalPdf = pdfUrl.trim();
    const finalThumb = thumbnailUrl.trim();
    if (!finalPdf) {
      alert('PDF upload karein ya PDF URL daalein.');
      return;
    }
    if (!date) {
      alert('Publish date chunein.');
      return;
    }

    setSaving(true);
    try {
      // Public doc me PDF ka link NAHI — wo private epaper_files me (subscriber ko server signed link deta hai)
      const epRef = await addDoc(collection(db, 'epaper'), {
        siteId,
        date,
        cityName: cityName.trim() || 'मुख्य',
        editionName: editionName.trim() || `${siteName(siteId)} ई-पेपर`,
        status,
        hasPdf: !!finalPdf,
        thumbnailUrl: finalThumb,
        thumbStoragePath: finalThumb && finalThumb === thumbUpload.url ? thumbUpload.storagePath : '',
        totalPages: Number(totalPages) || 0,
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'epaper_files', epRef.id), {
        pdfUrl: finalPdf,
        // Storage path sirf tab jab final URL isi upload ka ho (signed link + delete ke liye)
        pdfStoragePath: finalPdf === pdfUpload.url ? pdfUpload.storagePath : '',
        createdAt: serverTimestamp()
      });
      // Upload ka public download token turant band
      secureEditions();
      if (status === 'published') {
        notifyContent({
          title: `आज का ई-पेपर: ${editionName.trim() || siteName(siteId)}`,
          message: `${cityName.trim() || 'मुख्य'} संस्करण · ${date}`,
          link: '/epaper',
          image: finalThumb || '',
          type: 'epaper',
          portals: portalsFrom(siteId),
          sourceId: epRef.id
        });
      }
      alert(`E-Paper ${status === 'published' ? 'publish' : 'draft me save'} ho gaya: ${siteName(siteId)}`);
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert('Save karne me error: ' + err.message);
    }
    setSaving(false);
  };

  const toggleStatus = async (ed: EPaperDoc) => {
    const next = ed.status === 'published' ? 'draft' : 'published';
    try {
      await updateDoc(doc(db, 'epaper', ed.id), { status: next });
    } catch (err: any) {
      alert('Status update error: ' + err.message);
    }
  };

  const handleDelete = async (ed: EPaperDoc) => {
    if (!window.confirm(`"${ed.editionName}" (${ed.date}) delete karein?`)) return;
    try {
      const priv = (await getDoc(doc(db, 'epaper_files', ed.id)).catch(() => null))?.data() || {};
      await deleteDoc(doc(db, 'epaper', ed.id));
      await deleteDoc(doc(db, 'epaper_files', ed.id)).catch(() => {});
      // Storage se bhi uploaded files hatao (best effort)
      for (const path of [ed.pdfStoragePath || priv.pdfStoragePath, ed.thumbStoragePath]) {
        if (path) await deleteObject(ref(storage, path)).catch((e) => console.warn('Storage delete skipped:', e.code));
      }
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    }
  };

  const visibleEditions = siteFilter === 'all-list' ? editions : editions.filter((e) => e.siteId === siteFilter);

  const renderSource = (
    label: string,
    mode: SourceMode,
    setMode: (m: SourceMode) => void,
    url: string,
    setUrl: (u: string) => void,
    upload: UploadState,
    inputRef: React.RefObject<HTMLInputElement | null>,
    accept: string,
    onFile: (e: React.ChangeEvent<HTMLInputElement>) => void,
    taskRef: React.RefObject<UploadTask | null>,
    hint: string,
    placeholder: string
  ) => (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className="ea-tabs">
        <button type="button" className={`ea-tab${mode === 'upload' ? ' on' : ''}`} onClick={() => setMode('upload')} disabled={upload.uploading}>
          💻 Desktop se Upload
        </button>
        <button type="button" className={`ea-tab${mode === 'url' ? ' on' : ''}`} onClick={() => setMode('url')} disabled={upload.uploading}>
          🔗 URL Paste
        </button>
      </div>

      {mode === 'upload' ? (
        <div className="ea-drop">
          <input ref={inputRef} type="file" accept={accept} onChange={onFile} style={{ display: 'none' }} />
          <button type="button" className="ea-file-btn" onClick={() => inputRef.current?.click()} disabled={upload.uploading}>
            📂 File Browse karein
          </button>
          <span className="ea-hint">{upload.fileName || hint}</span>
          {(upload.uploading || upload.progress > 0) && (
            <div style={{ width: '100%' }}>
              <div className="ea-bar">
                <div className={`ea-bar-fill${!upload.uploading && url ? ' done' : ''}`} style={{ width: `${upload.progress}%` }} />
              </div>
              <div className="ea-status">
                <span>{upload.uploading ? `Uploading… ${upload.progress}%` : url ? '✓ Upload complete' : `${upload.progress}%`}</span>
                {upload.uploading && (
                  <button type="button" className="ea-cancel" onClick={() => taskRef.current?.cancel()}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
          {upload.error && <div className="ea-err" style={{ width: '100%' }}>⚠️ {upload.error}</div>}
        </div>
      ) : (
        <input type="url" className={styles.inputControl} placeholder={placeholder} value={url} onChange={(e) => setUrl(e.target.value)} />
      )}
    </div>
  );

  return (
    <div style={{ color: 'var(--fg-fff)' }}>
      <style dangerouslySetInnerHTML={{ __html: EP_STYLES }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>E-Paper Editions ({editions.length})</h1>
          <p style={{ fontSize: '13px', color: 'var(--fg-94a3b8)' }}>Desktop se PDF / cover upload karein ya URL paste karein — selected portal ke /epaper par turant live</p>
        </div>
      </div>

      <div className={styles.formCard} style={{ maxWidth: '860px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Upload New E-Paper Edition</h2>

        <div className="ea-grid">
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Network Site</label>
            <select className={styles.inputControl} value={siteId} onChange={(e) => setSiteId(e.target.value)} disabled={isUploading}>
              {SITE_OPTIONS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name} ({s.slug})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Publish Date</label>
            <input type="date" className={styles.inputControl} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="ea-grid">
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Edition / City</label>
            <input type="text" className={styles.inputControl} value={cityName} onChange={(e) => setCityName(e.target.value)} placeholder="e.g. भोपाल, Delhi" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Edition Name (Optional)</label>
            <input type="text" className={styles.inputControl} value={editionName} onChange={(e) => setEditionName(e.target.value)} placeholder="e.g. मुख्य संस्करण" />
          </div>
        </div>

        <div className="ea-grid">
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Total Pages (Optional)</label>
            <input type="number" min={0} className={styles.inputControl} value={totalPages} onChange={(e) => setTotalPages(e.target.value)} placeholder="e.g. 12" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Status</label>
            <select className={styles.inputControl} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="published">Published (portal par live)</option>
              <option value="draft">Draft (chhupa hua)</option>
            </select>
          </div>
        </div>

        {renderSource(
          'E-Paper PDF',
          pdfMode,
          setPdfMode,
          pdfUrl,
          setPdfUrl,
          pdfUpload,
          pdfInputRef,
          'application/pdf,.pdf',
          handlePdfFile,
          pdfTaskRef,
          'Sirf .pdf file',
          'https://.../newspaper.pdf'
        )}

        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {renderSource(
              'Front Page Cover / Thumbnail',
              thumbMode,
              setThumbMode,
              thumbnailUrl,
              setThumbnailUrl,
              thumbUpload,
              thumbInputRef,
              'image/*',
              handleThumbFile,
              thumbTaskRef,
              'JPG / PNG / WebP',
              'https://.../front-page.jpg'
            )}
          </div>
          {thumbnailUrl && <img src={thumbnailUrl} alt="Cover preview" className="ea-thumb-preview" style={{ marginTop: '26px' }} />}
        </div>

        {pdfUrl && pdfMode === 'upload' && (
          <div className="ea-ok">
            ✓ PDF ready:{' '}
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--fg-6ee7b7)' }}>
              preview kholein ↗
            </a>
          </div>
        )}

        <button onClick={handleSave} className={styles.btnPrimary} disabled={saving || isUploading} style={{ marginTop: '14px', opacity: saving || isUploading ? 0.6 : 1 }}>
          {isUploading ? 'Upload poora hone dein…' : saving ? 'Saving…' : status === 'published' ? 'Create & Publish Issue' : 'Save as Draft'}
        </button>
      </div>

      {/* Existing editions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '28px 0 12px', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Uploaded Editions</h2>
        <select className={styles.inputControl} style={{ maxWidth: '260px' }} value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
          <option value="all-list">All sites</option>
          {SITE_OPTIONS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {visibleEditions.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '13px' }}>Abhi koi e-paper upload nahi hua.</p>
      ) : (
        <div className="ea-list">
          {visibleEditions.map((ed) => {
            const isLive = ed.status !== 'draft';
            return (
              <div key={ed.id} className="ea-card">
                {ed.thumbnailUrl ? <img src={ed.thumbnailUrl} alt='' /> : <div style={{ width: 70, aspectRatio: '3/4', borderRadius: 6, background: "var(--bg-1e293b)", flexShrink: 0 }} />}
                <div className="ea-card-body">
                  <span className="ea-card-title">{ed.editionName}</span>
                  <span>
                    {ed.cityName} · {ed.date}
                  </span>
                  <span>{siteName(ed.siteId)}</span>
                  <span className="ea-pill" style={{ background: isLive ? 'rgba(16,185,129,.15)' : 'rgba(148,163,184,.15)', color: isLive ? 'var(--fg-6ee7b7)' : 'var(--fg-cbd5e1)' }}>
                    {isLive ? '● Live' : 'Draft'}
                  </span>
                  <div className="ea-actions">
                    {(ed.pdfUrl || (ed as any).hasPdf) && (
                      <button className="ea-act" onClick={() => openPdf(ed)}>
                        PDF ↗
                      </button>
                    )}
                    <a className="ea-act" href={`/epaper?site=${ed.siteId === 'all' ? 'the-local-leader' : ed.siteId}`} target="_blank" rel="noopener noreferrer">
                      Portal ↗
                    </a>
                    <button className="ea-act" onClick={() => toggleStatus(ed)}>
                      {isLive ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="ea-act danger" onClick={() => handleDelete(ed)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
