'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, getDocs, limit, query, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NETWORK_SITES } from '@/lib/portals';
import { fallbackFor } from '@/lib/siteTheme';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { isDirectVideo, makeSlug, readTimeMinutes, stripHtml, suggestTags, youtubeEmbedUrl, youtubeId } from '@/lib/articles';
import { uploadArticleMedia, uploadErrorMessage, validateMedia, type MediaKind } from '@/lib/mediaUpload';

// Homepage tabs ke hisaab se (English naam lib/categories ke group se match hote hain)
const CATEGORIES: { value: string; en: string }[] = [
  { value: 'राजनीति', en: 'Politics' },
  { value: 'देश', en: 'National' },
  { value: 'राज्य', en: 'State' },
  { value: 'व्यापार', en: 'Business' },
  { value: 'खेल', en: 'Sports' },
  { value: 'अपराध', en: 'Crime' },
  { value: 'स्वास्थ्य', en: 'Health' },
  { value: 'जीवनशैली', en: 'Lifestyle' },
  { value: 'मनोरंजन', en: 'Entertainment' },
  { value: 'तकनीक', en: 'Technology' },
  { value: 'कृषि', en: 'Agriculture' },
  { value: 'रक्षा', en: 'Defence' }
];

// Homepage ke trending tags — sujhaav me bhi
const BASE_TAGS = ['बजट सत्र', 'पंचायत चुनाव', 'बारिश का मौसम', 'मंडी भाव', 'भर्ती परिणाम', 'बिजली दर', 'क्रिकेट लीग', 'Breaking News', 'Elections', 'Weather'];

const S = {
  card: { background: '#0b1120', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' } as React.CSSProperties,
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' } as React.CSSProperties,
  hint: { fontSize: '11px', color: '#64748b', marginTop: '5px' } as React.CSSProperties,
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties
};

const PAGE_CSS = `
.ae-grid{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:22px}
@media(max-width:1100px){.ae-grid{grid-template-columns:1fr}}
.ae-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:16px;font-size:12px;border:1px solid #2563eb;background:#1e3a8a;color:#bfdbfe}
.ae-chip button{background:none;border:0;color:#93c5fd;cursor:pointer;font-size:13px;padding:0;line-height:1}
.ae-sug{padding:4px 10px;border-radius:16px;font-size:12px;border:1px dashed #475569;background:transparent;color:#94a3b8;cursor:pointer;font-family:inherit}
.ae-sug:hover{border-color:#38bdf8;color:#e0f2fe}
.ae-site{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:7px;cursor:pointer;font-size:13px;color:#e2e8f0;border:1px solid transparent}
.ae-site:hover{background:#0f172a}
.ae-site.on{border-color:#1d4ed8;background:#0f1d3a}
.ae-site input{accent-color:#2563eb;width:16px;height:16px}
.ae-drop{border:1.5px dashed #334155;border-radius:8px;padding:20px;text-align:center;cursor:pointer;color:#cbd5e1;background:transparent;width:100%;font-family:inherit}
.ae-drop:hover,.ae-drop.drag{border-color:#38bdf8;background:#0b1730}
.ae-tab{background:none;border:0;padding:8px 4px;cursor:pointer;font-size:13.5px;font-family:inherit}
.ae-seg{display:flex;background:#020617;border:1px solid #334155;border-radius:8px;padding:3px;gap:3px}
.ae-seg button{flex:1;border:0;border-radius:6px;padding:8px 6px;font-size:12.5px;cursor:pointer;background:transparent;color:#94a3b8;font-family:inherit}
.ae-seg button.on{background:#2563eb;color:#fff;font-weight:600}
.ae-switch{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0;font-size:13px;color:#e2e8f0;cursor:pointer}
.ae-switch input{accent-color:#2563eb;width:16px;height:16px}
.ae-thumb{position:relative;border-radius:8px;overflow:hidden;border:1px solid #334155}
.ae-thumb img,.ae-thumb video,.ae-thumb iframe{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border:0;background:#000}
.ae-x{position:absolute;top:6px;right:6px;background:rgba(2,6,23,.85);color:#fff;border:1px solid #475569;border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer}
.ae-gal{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.ae-gal div{position:relative}
.ae-gal img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;display:block}
.ae-err{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);color:#fca5a5;border-radius:8px;padding:10px 12px;font-size:13px}
.ae-ok{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.4);color:#6ee7b7;border-radius:8px;padding:10px 12px;font-size:13px}
`;

type PublishMode = 'now' | 'schedule';

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** Ek photo/video chunne ka box: device se upload ya URL */
function MediaBox({
  kind,
  value,
  onChange,
  allowYoutube = false
}: {
  kind: MediaKind;
  value: string;
  onChange: (url: string) => void;
  allowYoutube?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const upload = async (file?: File | null) => {
    if (!file) return;
    const bad = validateMedia(file, kind);
    if (bad) return setErr(bad);
    setErr('');
    setPct(0);
    try {
      onChange(await uploadArticleMedia(file, kind, setPct));
    } catch (e) {
      console.error('Media upload error:', e);
      setErr(uploadErrorMessage(e));
    } finally {
      setPct(null);
    }
  };

  const applyUrl = () => {
    const u = urlDraft.trim();
    if (!u) return;
    if (kind === 'video' && allowYoutube && youtubeId(u)) {
      onChange(u);
      setUrlDraft('');
      return;
    }
    if (!/^https:\/\/\S+$/i.test(u)) return setErr('कृपया https:// से शुरू होने वाला सही URL डालें।');
    if (kind === 'video' && !isDirectVideo(u)) return setErr('YouTube लिंक या सीधा वीडियो (.mp4) URL डालें।');
    setErr('');
    onChange(u);
    setUrlDraft('');
  };

  const yt = kind === 'video' ? youtubeId(value) : null;

  return (
    <div>
      {value ? (
        <div className="ae-thumb">
          {kind === 'image' ? (
            <img src={value} alt="चुनी गई फ़ोटो" />
          ) : yt ? (
            <iframe src={youtubeEmbedUrl(yt)} title="वीडियो" />
          ) : (
            <video src={value} controls preload="metadata" />
          )}
          <button type="button" className="ae-x" onClick={() => onChange('')}>
            ✕ हटाएं
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`ae-drop ${drag ? 'drag' : ''}`}
          disabled={pct !== null}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            upload(e.dataTransfer.files?.[0]);
          }}
        >
          <div style={{ fontSize: '22px' }}>{kind === 'image' ? '🖼️' : '🎬'}</div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>
            {pct !== null ? `अपलोड हो रहा है… ${pct}%` : `डिवाइस से ${kind === 'image' ? 'फ़ोटो' : 'वीडियो'} चुनें`}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {kind === 'image' ? 'PNG, JPG, WebP · max 10MB · या यहाँ खींचकर छोड़ें' : 'MP4, WebM, MOV · max 200MB'}
          </div>
          {pct !== null && (
            <div style={{ height: '4px', background: '#1e293b', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#38bdf8', transition: 'width .2s' }} />
            </div>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={kind === 'image' ? 'image/png,image/jpeg,image/webp,image/gif' : 'video/mp4,video/webm,video/ogg,video/quicktime'}
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {!value && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <input
            style={{ ...S.input, fontSize: '12px', padding: '7px 10px' }}
            placeholder={kind === 'image' ? 'या फ़ोटो URL चिपकाएं' : allowYoutube ? 'या YouTube / वीडियो URL' : 'या वीडियो URL'}
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyUrl())}
          />
          <button type="button" onClick={applyUrl} style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '6px', padding: '0 12px', fontSize: '12px', cursor: 'pointer' }}>
            जोड़ें
          </button>
        </div>
      )}
      {err && <div style={{ ...S.hint, color: '#f87171' }}>{err}</div>}
    </div>
  );
}

export default function NewArticlePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');
  const [saving, setSaving] = useState<'' | 'draft' | 'publish'>('');
  const [error, setError] = useState('');
  const [siteNames, setSiteNames] = useState<Record<string, string>>({});

  // Content
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  // Media
  const [thumbnail, setThumbnail] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryPct, setGalleryPct] = useState<number | null>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  // Publishing
  const [sites, setSites] = useState<string[]>([]);
  const [publishMode, setPublishMode] = useState<PublishMode>('now');
  const [scheduleAt, setScheduleAt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [popularTags, setPopularTags] = useState<string[]>(BASE_TAGS);

  // Settings
  const [authorName, setAuthorName] = useState('संपादकीय टीम');
  const [source, setSource] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [allowComments, setAllowComments] = useState(true);

  // SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');

  const allSelected = sites.length === NETWORK_SITES.length;

  // Portal naam (admin me set) + pehle istemal hue tags
  useEffect(() => {
    getDocs(collection(db, 'sites'))
      .then((snap) => setSiteNames(Object.fromEntries(snap.docs.map((d) => [d.id, d.data().name || '']))))
      .catch((err) => console.error('Sites load error:', err));
    getDocs(query(collection(db, 'articles'), limit(300)))
      .then((snap) => {
        const count = new Map<string, number>();
        snap.docs.forEach((d) => (d.data().tags || []).forEach((t: string) => t && count.set(t, (count.get(t) || 0) + 1)));
        const used = Array.from(count.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([t]) => t);
        setPopularTags(Array.from(new Set([...used, ...BASE_TAGS])));
      })
      .catch((err) => console.error('Tags load error:', err));
  }, []);

  const handleTitle = (v: string) => {
    setTitle(v);
    if (!slugTouched) setSlug(v.trim() ? makeSlug(titleEn || v) : '');
  };
  const handleTitleEn = (v: string) => {
    setTitleEn(v);
    if (!slugTouched && (v || title)) setSlug(makeSlug(v || title));
  };

  const toggleSite = (slug: string) => setSites((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  const addTag = (raw: string) => {
    const t = raw.replace(/[#<>{}[\]]/g, '').trim().slice(0, 40);
    if (!t || tags.some((x) => x.toLowerCase() === t.toLowerCase()) || tags.length >= 15) return;
    setTags([...tags, t]);
  };

  const suggestions = useMemo(
    () => suggestTags({ title, summary, content, category }, popularTags, tags),
    [title, summary, content, category, popularTags, tags]
  );

  const uploadGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 12 - gallery.length);
    setError('');
    for (let i = 0; i < list.length; i++) {
      const bad = validateMedia(list[i], 'image');
      if (bad) {
        setError(`${list[i].name}: ${bad}`);
        continue;
      }
      try {
        const url = await uploadArticleMedia(list[i], 'image', (p) => setGalleryPct(Math.round(((i + p / 100) / list.length) * 100)));
        setGallery((g) => [...g, url]);
      } catch (e) {
        setError(uploadErrorMessage(e));
      }
    }
    setGalleryPct(null);
  };

  const plainContent = stripHtml(content);
  const firstContentImage = content.match(/<img[^>]+src="([^"]+)"/i)?.[1] || '';

  const validate = (mode: 'draft' | 'publish') => {
    if (!title.trim()) return 'कृपया खबर का शीर्षक लिखें।';
    if (mode === 'draft') return '';
    if (sites.length === 0) return 'कृपया कम से कम एक पोर्टल चुनें (या "सभी पोर्टल")।';
    if (!category) return 'कृपया श्रेणी (Category) चुनें।';
    if (plainContent.length < 30 && !videoUrl) return 'कृपया खबर का विस्तृत कंटेंट लिखें (कम से कम 30 अक्षर)।';
    if (publishMode === 'schedule') {
      const at = new Date(scheduleAt);
      if (!scheduleAt || Number.isNaN(at.getTime())) return 'कृपया प्रकाशन की तारीख और समय चुनें।';
      if (at.getTime() < Date.now() + 60 * 1000) return 'शेड्यूल का समय अभी से कम से कम 1 मिनट बाद का होना चाहिए।';
    }
    return '';
  };

  const handleSave = async (mode: 'draft' | 'publish') => {
    const problem = validate(mode);
    if (problem) {
      setError(problem);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError('');
    setSaving(mode);
    const scheduled = mode === 'publish' && publishMode === 'schedule';
    const publishDate = scheduled ? new Date(scheduleAt) : new Date();
    const status = mode === 'draft' ? 'draft' : scheduled ? 'scheduled' : 'published';
    const finalSites = sites.length ? sites : [];
    try {
      await addDoc(collection(db, 'articles'), {
        title: title.trim(),
        titleHi: title.trim(),
        titleEn: titleEn.trim(),
        slug: slug.trim() || makeSlug(titleEn || title),
        summary: summary.trim(),
        content,
        contentText: plainContent.slice(0, 5000),
        status,
        publishAt: mode === 'draft' ? null : Timestamp.fromDate(publishDate),
        // siteId = pehla portal (purane pages ke liye), siteIds = sabhi chune portal
        siteId: finalSites[0] || '',
        siteIds: finalSites,
        allSites: finalSites.length === NETWORK_SITES.length,
        category,
        tags,
        image: thumbnail || firstContentImage,
        imageCaption: imageCaption.trim(),
        videoUrl: videoUrl.trim(),
        gallery,
        authorName: authorName.trim() || 'संपादकीय टीम',
        source: source.trim(),
        state: state.trim(),
        city: city.trim(),
        location: [city.trim(), state.trim()].filter(Boolean).join(', '),
        isBreaking,
        isFeatured,
        allowComments,
        readTime: readTimeMinutes(content),
        seo: {
          title: (metaTitle || title).trim().slice(0, 70),
          description: (metaDescription || summary || plainContent).trim().slice(0, 160),
          focusKeyword: focusKeyword.trim()
        },
        views: 0,
        createdBy: 'admin',
        createdAt: publishDate.toISOString().split('T')[0],
        timestamp: serverTimestamp()
      });
      const where = finalSites.length === NETWORK_SITES.length ? 'सभी पोर्टल' : finalSites.map((s) => siteNames[s] || fallbackFor(s).name).join(', ');
      alert(
        mode === 'draft'
          ? '💾 ड्राफ्ट सेव हो गया।'
          : scheduled
            ? `⏰ खबर शेड्यूल हो गई — ${publishDate.toLocaleString('hi-IN')} पर ${where} पर दिखेगी।`
            : `✅ खबर प्रकाशित हो गई — ${where}`
      );
      router.push('/admin/articles');
    } catch (e: any) {
      console.error('Article save error:', e);
      setError('खबर सेव नहीं हो पाई: ' + e.message);
      setSaving('');
    }
  };

  const tabStyle = (t: string): React.CSSProperties => ({
    borderBottom: activeTab === t ? '2px solid #2563eb' : '2px solid transparent',
    color: activeTab === t ? '#38bdf8' : '#94a3b8'
  });

  const previewUrl = `https://${NETWORK_SITES.find((s) => s.slug === sites[0])?.domain || 'thelocalleader.in'}/article/${slug || 'news'}`;

  return (
    <div style={{ color: '#fff', maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin/articles" style={{ color: '#fff', textDecoration: 'none', fontSize: '18px', fontWeight: 700 }} aria-label="वापस">
            ←
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>New Article</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={!!saving}
            style={{ padding: '9px 16px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
          >
            {saving === 'draft' ? 'सेव हो रहा है…' : '💾 Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSave('publish')}
            disabled={!!saving}
            style={{ padding: '9px 18px', background: publishMode === 'schedule' ? '#7c3aed' : '#2563eb', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            {saving === 'publish' ? 'सेव हो रहा है…' : publishMode === 'schedule' ? '⏰ Schedule' : '🚀 Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="ae-err" role="alert" style={{ marginBottom: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #1e293b', marginBottom: '20px' }} role="tablist">
        {(
          [
            ['content', 'Content'],
            ['seo', 'SEO'],
            ['settings', 'Settings']
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={activeTab === k} className="ae-tab" style={tabStyle(k)} onClick={() => setActiveTab(k)}>
            {l}
          </button>
        ))}
      </div>

      <div className="ae-grid">
        {/* ===== LEFT ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          {activeTab === 'content' && (
            <>
              <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={S.label}>शीर्षक (Headline) *</label>
                  <input style={{ ...S.input, fontSize: '16px', fontWeight: 600 }} placeholder="खबर का शीर्षक लिखें…" value={title} maxLength={160} onChange={(e) => handleTitle(e.target.value)} />
                  <div style={S.hint}>{title.length}/160 · छोटा और साफ़ शीर्षक (60-90 अक्षर) सबसे अच्छा</div>
                </div>
                <div>
                  <label style={S.label}>English Title (वैकल्पिक — English पोर्टल और URL के लिए)</label>
                  <input style={S.input} placeholder="English headline…" value={titleEn} maxLength={160} onChange={(e) => handleTitleEn(e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>Slug (URL)</label>
                  <input
                    style={{ ...S.input, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '13px' }}
                    placeholder="apne-aap-banega"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'));
                    }}
                  />
                </div>
                <div>
                  <label style={S.label}>सारांश (Summary)</label>
                  <textarea rows={3} style={{ ...S.input, resize: 'vertical' }} placeholder="खबर का संक्षिप्त सार (homepage और share में दिखता है)…" value={summary} maxLength={400} onChange={(e) => setSummary(e.target.value)} />
                  <div style={S.hint}>{summary.length}/400</div>
                </div>
              </div>

              <div style={S.card}>
                <label style={{ ...S.label, marginBottom: '10px' }}>कंटेंट (फ़ोटो, वीडियो, YouTube सहित) *</label>
                <RichTextEditor value={content} onChange={setContent} />
              </div>

              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ ...S.label, marginBottom: 0 }}>फ़ोटो गैलरी (वैकल्पिक)</label>
                  <span style={S.hint}>{gallery.length}/12</span>
                </div>
                {gallery.length > 0 && (
                  <div className="ae-gal" style={{ marginBottom: '10px' }}>
                    {gallery.map((g, i) => (
                      <div key={g}>
                        <img src={g} alt={`गैलरी ${i + 1}`} />
                        <button type="button" className="ae-x" onClick={() => setGallery(gallery.filter((x) => x !== g))} aria-label="हटाएं">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {gallery.length < 12 && (
                  <button type="button" className="ae-drop" disabled={galleryPct !== null} onClick={() => galleryInput.current?.click()}>
                    {galleryPct !== null ? `अपलोड हो रहा है… ${galleryPct}%` : '🖼️ डिवाइस से एक या कई फ़ोटो चुनें'}
                  </button>
                )}
                <input ref={galleryInput} type="file" hidden multiple accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => (uploadGallery(e.target.files), (e.target.value = ''))} />
              </div>
            </>
          )}

          {activeTab === 'seo' && (
            <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={S.label}>Meta Title</label>
                <input style={S.input} placeholder={title || 'Google में दिखने वाला शीर्षक'} value={metaTitle} maxLength={70} onChange={(e) => setMetaTitle(e.target.value)} />
                <div style={S.hint}>{(metaTitle || title).length}/70 · खाली छोड़ें तो शीर्षक ही लगेगा</div>
              </div>
              <div>
                <label style={S.label}>Meta Description</label>
                <textarea rows={3} style={{ ...S.input, resize: 'vertical' }} placeholder={summary || 'Google में दिखने वाला विवरण'} value={metaDescription} maxLength={160} onChange={(e) => setMetaDescription(e.target.value)} />
                <div style={S.hint}>{(metaDescription || summary).length}/160 · खाली छोड़ें तो सारांश लगेगा</div>
              </div>
              <div>
                <label style={S.label}>Focus Keyword</label>
                <input style={S.input} placeholder="जैसे: इंदौर मंडी भाव" value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} />
                {focusKeyword && (
                  <div style={{ ...S.hint, color: (title + plainContent).toLowerCase().includes(focusKeyword.toLowerCase()) ? '#6ee7b7' : '#fbbf24' }}>
                    {(title + plainContent).toLowerCase().includes(focusKeyword.toLowerCase()) ? '✓ कीवर्ड शीर्षक/कंटेंट में है' : 'कीवर्ड शीर्षक या कंटेंट में नहीं मिला'}
                  </div>
                )}
              </div>
              <div>
                <label style={S.label}>Google प्रीव्यू</label>
                <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 16px', fontFamily: 'Arial, sans-serif' }}>
                  <div style={{ fontSize: '12px', color: '#202124' }}>{previewUrl}</div>
                  <div style={{ fontSize: '18px', color: '#1a0dab', margin: '4px 0', lineHeight: 1.3 }}>{(metaTitle || title || 'खबर का शीर्षक').slice(0, 70)}</div>
                  <div style={{ fontSize: '13px', color: '#4d5156', lineHeight: 1.5 }}>{(metaDescription || summary || plainContent || 'खबर का विवरण…').slice(0, 160)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ ...S.card, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={S.label}>लेखक / रिपोर्टर का नाम</label>
                <input style={S.input} value={authorName} maxLength={60} onChange={(e) => setAuthorName(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>स्रोत / साभार (वैकल्पिक)</label>
                <input style={S.input} placeholder="जैसे: PTI, ANI, जिला प्रशासन" value={source} maxLength={60} onChange={(e) => setSource(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>राज्य</label>
                <input style={S.input} placeholder="जैसे: मध्य प्रदेश" value={state} maxLength={40} onChange={(e) => setState(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>शहर / जिला</label>
                <input style={S.input} placeholder="जैसे: इंदौर" value={city} maxLength={40} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Thumbnail कैप्शन / फ़ोटो क्रेडिट</label>
                <input style={S.input} placeholder="जैसे: फ़ोटो — संवाददाता" value={imageCaption} maxLength={120} onChange={(e) => setImageCaption(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Publish */}
          <div style={S.card}>
            <label style={S.label}>प्रकाशन</label>
            <div className="ae-seg">
              <button type="button" className={publishMode === 'now' ? 'on' : ''} onClick={() => setPublishMode('now')}>
                🚀 अभी प्रकाशित
              </button>
              <button
                type="button"
                className={publishMode === 'schedule' ? 'on' : ''}
                onClick={() => {
                  setPublishMode('schedule');
                  if (!scheduleAt) setScheduleAt(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
                }}
              >
                ⏰ शेड्यूल करें
              </button>
            </div>
            {publishMode === 'schedule' && (
              <div style={{ marginTop: '10px' }}>
                <input type="datetime-local" style={S.input} value={scheduleAt} min={toLocalInput(new Date())} onChange={(e) => setScheduleAt(e.target.value)} />
                <div style={S.hint}>इस समय से पहले खबर किसी पोर्टल पर नहीं दिखेगी।</div>
              </div>
            )}
            <div style={{ ...S.hint, marginTop: '10px' }}>“Save Draft” से खबर सिर्फ एडमिन में रहती है।</div>
          </div>

          {/* Portals */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ ...S.label, marginBottom: 0 }}>किस पोर्टल पर प्रकाशित करें *</label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{sites.length} चुने</span>
            </div>
            <button
              type="button"
              onClick={() => setSites(allSelected ? [] : NETWORK_SITES.map((s) => s.slug))}
              style={{
                width: '100%',
                marginBottom: '8px',
                padding: '9px',
                borderRadius: '7px',
                border: `1px solid ${allSelected ? '#16a34a' : '#334155'}`,
                background: allSelected ? 'rgba(22,163,74,.15)' : '#020617',
                color: allSelected ? '#86efac' : '#e2e8f0',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {allSelected ? '✓ सभी पोर्टल चुने गए (हटाने के लिए क्लिक करें)' : '🌐 सभी पोर्टल पर प्रकाशित करें'}
            </button>
            {NETWORK_SITES.map((s) => {
              const on = sites.includes(s.slug);
              return (
                <label key={s.slug} className={`ae-site ${on ? 'on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleSite(s.slug)} />
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: fallbackFor(s.slug).primaryColor, flexShrink: 0 }} />
                  <span>{siteNames[s.slug] || fallbackFor(s.slug).name}</span>
                </label>
              );
            })}
            <div style={S.hint}>खबर सिर्फ चुने गए पोर्टल्स पर ही दिखेगी।</div>
          </div>

          {/* Category */}
          <div style={S.card}>
            <label style={S.label}>श्रेणी (Category) *</label>
            <select style={S.input} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">श्रेणी चुनें</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value} ({c.en})
                </option>
              ))}
            </select>
          </div>

          {/* Thumbnail */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ ...S.label, marginBottom: 0 }}>Thumbnail फ़ोटो</label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{thumbnail ? '' : firstContentImage ? 'कंटेंट की पहली फ़ोटो लगेगी' : 'अनुशंसित'}</span>
            </div>
            <MediaBox kind="image" value={thumbnail} onChange={setThumbnail} />
          </div>

          {/* Featured video */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ ...S.label, marginBottom: 0 }}>मुख्य वीडियो</label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>वैकल्पिक</span>
            </div>
            <MediaBox kind="video" value={videoUrl} onChange={setVideoUrl} allowYoutube />
          </div>

          {/* Tags */}
          <div style={S.card}>
            <label style={S.label}>टैग्स</label>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {tags.map((t) => (
                  <span key={t} className="ae-chip">
                    #{t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`${t} हटाएं`}>
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              style={S.input}
              placeholder="टैग लिखें और Enter / , दबाएं"
              value={tagDraft}
              onChange={(e) => {
                const v = e.target.value;
                if (v.endsWith(',')) {
                  addTag(v.slice(0, -1));
                  setTagDraft('');
                } else setTagDraft(v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(tagDraft);
                  setTagDraft('');
                } else if (e.key === 'Backspace' && !tagDraft && tags.length) setTags(tags.slice(0, -1));
              }}
            />
            {suggestions.length > 0 && (
              <>
                <div style={{ ...S.hint, margin: '10px 0 6px' }}>✨ सुझाए गए टैग (खबर के हिसाब से) — जोड़ने के लिए क्लिक करें</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {suggestions.map((t) => (
                    <button key={t} type="button" className="ae-sug" onClick={() => addTag(t)}>
                      + {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Options */}
          <div style={S.card}>
            <label style={S.label}>विकल्प</label>
            <label className="ae-switch">
              <span>🔴 ब्रेकिंग न्यूज़</span>
              <input type="checkbox" checked={isBreaking} onChange={(e) => setIsBreaking(e.target.checked)} />
            </label>
            <label className="ae-switch">
              <span>⭐ मुख्य खबर (Featured)</span>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            </label>
            <label className="ae-switch">
              <span>💬 कमेंट्स चालू</span>
              <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
