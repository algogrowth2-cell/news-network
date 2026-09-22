'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, addDoc, query, where, limit, getDocs, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Footer from '@/components/Footer';

interface ArticleDetail {
  id: string;
  title: string;
  titleHi?: string;
  content?: string;
  summary?: string;
  image?: string;
  category?: string;
  createdAt?: string;
  views?: number;
  siteId?: string;
  authorName?: string;
}

interface CommentItem {
  id: string;
  userName: string;
  comment: string;
  createdAt: string;
  status: string;
}

const DEFAULT_SITES_CONFIG: Record<string, any> = {
  'the-local-leader': { name: 'द लोकल लीडर', primaryColor: '#ea580c', description: '— जनता की आवाज़, सच्चाई के साथ —' },
  'bazar-karobar': { name: 'बाजार कारोबार', primaryColor: '#059669', description: '— व्यापार, अर्थव्यवस्था और बाज़ार का सच्चा दर्पण —' },
  'golden-pearl-chronicles': { name: 'गोल्डन पर्ल क्रॉनिकल्स', primaryColor: '#d97706', description: '— साहित्य, कला एवं संस्कृति की धरोहर —' },
  'the-provue-times': { name: 'द प्रोव्यू टाइम्स', primaryColor: '#2563eb', description: '— निष्पक्ष दृष्टि, निर्भीक विश्लेषण —' },
  'desh-ki-aawaz': { name: 'देश की आवाज़', primaryColor: '#dc2626', description: '— हर भारतीय का मंच, हर दिल की पुकार —' },
  'jan-bharat-news': { name: 'जन भारत न्यूज़', primaryColor: '#7c3aed', description: '— जन-जन की खबर, देश के कोने-कोने से —' },
  'news-info-24': { name: 'NEWS INFO 24', primaryColor: '#0284c7', description: '— 24 घंटे सबसे तेज़, सबसे सटीक ख़बरें —' },
  'ndn-defence': { name: 'National Defence Network', primaryColor: '#15803d', description: '— राष्ट्र रक्षा, सामरिक शक्ति और सुरक्षा विश्लेषण —' }
};

export default function ArticleDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const articleId = params?.id as string;

  const [siteSlug, setSiteSlug] = useState<string>('the-local-leader');
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<ArticleDetail[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<ArticleDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [readerUser, setReaderUser] = useState<any>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('reader_user');
    if (cached) { try { setReaderUser(JSON.parse(cached)); } catch (e) { console.error(e); } }
  }, []);

  useEffect(() => {
    if (!articleId) return;
    async function fetchArticle() {
      setLoading(true);
      try {
        const docRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as ArticleDetail;
          setArticle(data);
          const querySite = searchParams.get('site');
          const finalSlug = (querySite || data.siteId || 'the-local-leader').toLowerCase();
          setSiteSlug(finalSlug);
          updateDoc(docRef, { views: increment(1) }).catch(() => {});
        }
      } catch (err) { console.error('Error fetching article:', err); }
      setLoading(false);
    }
    fetchArticle();
  }, [articleId, searchParams]);

  useEffect(() => {
    if (!siteSlug) return;
    const unsubSite = onSnapshot(doc(db, 'sites', siteSlug), (snap) => {
      if (snap.exists()) { setSiteConfig({ slug: siteSlug, ...snap.data() }); }
      else {
        const fallback = DEFAULT_SITES_CONFIG[siteSlug] || DEFAULT_SITES_CONFIG['the-local-leader'];
        setSiteConfig({ slug: siteSlug, name: fallback.name, primaryColor: fallback.primaryColor, logoUrl: `/logos/${siteSlug}.jpeg`, description: fallback.description });
      }
    });
    return () => unsubSite();
  }, [siteSlug]);

  useEffect(() => {
    if (!siteSlug) return;
    async function fetchSideArticles() {
      try {
        const qSide = query(collection(db, 'articles'), where('siteId', 'in', [siteSlug, siteSlug.toLowerCase()]), limit(8));
        const snap = await getDocs(qSide);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ArticleDetail)).filter((item) => item.id !== articleId);
        setRelatedArticles(list.slice(0, 4));
        setTrendingArticles(list.slice(4, 8).length > 0 ? list.slice(4, 8) : list.slice(0, 4));
      } catch (e) { console.error('Sidebar articles fetch error:', e); }
    }
    fetchSideArticles();
  }, [siteSlug, articleId]);

  useEffect(() => {
    if (!articleId) return;
    const qComments = query(collection(db, 'comments'), where('articleId', '==', articleId), where('status', '==', 'approved'));
    const unsubComments = onSnapshot(qComments, (snap) => {
      const list: CommentItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CommentItem));
      setComments(list);
    });
    return () => unsubComments();
  }, [articleId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!readerUser) { alert('कृपया टिप्पणी करने के लिए पहले लॉगिन करें।'); return; }
    setCommentSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        articleId, articleTitle: article?.title || '', siteId: siteSlug,
        userName: readerUser.name || 'पाठक', userEmail: readerUser.email || '',
        comment: newComment.trim(), createdAt: new Date().toISOString().split('T')[0], status: 'pending'
      });
      setNewComment(''); setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 5000);
    } catch (err) { console.error('Error posting comment:', err); alert('टिप्पणी पोस्ट करने में समस्या आई।'); }
    setCommentSubmitting(false);
  };

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = encodeURIComponent(`${article?.title} - ${siteName}`);
    if (platform === 'whatsapp') { window.open(`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(currentUrl)}`, '_blank'); }
    else if (platform === 'facebook') { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank'); }
    else if (platform === 'twitter') { window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(currentUrl)}`, '_blank'); }
    else { navigator.clipboard.writeText(currentUrl); alert('खबर का लिंक कॉपी हो गया है!'); }
  };

  const primary = siteConfig?.primaryColor || '#ea580c';
  const siteName = siteConfig?.name || 'द लोकल लीडर';
  const siteLogo = siteConfig?.logoUrl || `/logos/${siteSlug}.jpeg`;
  const siteTagline = siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —';
  const cssVars = { '--p': primary } as React.CSSProperties;

  /* ── Loading ── */
  if (loading) {
    return (
      <>
        <style jsx global>{allCSS}</style>
        <div className="ap-load">
          <div className="ap-load-ring"><div /><div /><div /></div>
          <span className="ap-load-t">खबर लोड हो रही है…</span>
        </div>
      </>
    );
  }

  /* ── 404 ── */
  if (!article) {
    return (
      <>
        <style jsx global>{allCSS}</style>
        <div className="ap-nil">
          <span className="ap-nil-ico">📰</span>
          <h2 className="ap-nil-h">यह खबर उपलब्ध नहीं है</h2>
          <p className="ap-nil-p">शायद यह खबर हटा दी गई है या लिंक गलत है।</p>
          <Link href={`/?site=${siteSlug}`} className="ap-nil-btn" style={{ background: primary }}>← मुख्य पृष्ठ पर वापस जाएं</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{allCSS}</style>

      <div className="ap-page" style={cssVars}>

        {/* ════════ HEADER ════════ */}
        <header className="ap-hdr">
          <div className="ap-hdr-in">
            <div className="ap-hdr-left">
              <Link href={`/?site=${siteSlug}`} className="ap-hdr-back">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                <span>{siteName}</span>
              </Link>
              <span className="ap-hdr-sep" />
              <span className="ap-hdr-cat">{article.category || 'National'}</span>
            </div>
            <div className="ap-hdr-right">
              <time className="ap-hdr-date">{article.createdAt || 'आज'}</time>
              <Link href={`/?site=${siteSlug}`} className="ap-hdr-home">होम</Link>
            </div>
          </div>
        </header>

        {/* ════════ 2-COL GRID ════════ */}
        <div className="ap-grid">

          {/* ──── LEFT: ARTICLE ──── */}
          <main className="ap-left">
            <article className="ap-card">

              {/* Category + Date */}
              <div className="ap-top-row">
                <span className="ap-pill" style={{ background: primary }}>{article.category || 'ताज़ा खबर'}</span>
                <span className="ap-top-date">{article.createdAt || 'हाल ही में'}</span>
              </div>

              {/* Title */}
              <h1 className="ap-h1">{article.title}</h1>

              {/* Author + Share Bar */}
              <div className="ap-bar">
                <div className="ap-author">
                  <span className="ap-author-av" style={{ background: primary }}>{(article.authorName || siteName).charAt(0)}</span>
                  <div className="ap-author-col">
                    <span className="ap-author-name">{article.authorName || siteName}</span>
                    <span className="ap-author-sub">
                      संपादकीय टीम
                      <span className="ap-author-dot">·</span>
                      <svg className="ap-eye-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {(article.views || 1).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="ap-share-row">
                  <button type="button" onClick={() => handleShare('whatsapp')} className="ap-share-btn ap-share-wa">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.616l4.556-1.472A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.326-.685-6.05-1.857l-.424-.296-2.698.872.892-2.637-.322-.453A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    WhatsApp
                  </button>
                  <button type="button" onClick={() => handleShare('facebook')} className="ap-share-btn ap-share-fb">FB</button>
                  <button type="button" onClick={() => handleShare('copy')} className="ap-share-btn ap-share-cp">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    कॉपी
                  </button>
                </div>
              </div>

              {/* Hero Image */}
              {article.image && (
                <figure className="ap-hero">
                  <img src={article.image} alt={article.title} className="ap-hero-img" />
                </figure>
              )}

              {/* Summary */}
              {article.summary && (
                <blockquote className="ap-summary" style={{ borderLeftColor: primary }}>{article.summary}</blockquote>
              )}

              {/* Body */}
              <div className="ap-body">{article.content || article.summary || 'खबर का विस्तृत विवरण जल्द ही उपलब्ध कराया जाएगा।'}</div>

              {/* Share Footer */}
              <div className="ap-share-foot">
                <span className="ap-share-foot-t">इस खबर को अपने दोस्तों के साथ साझा करें</span>
                <div className="ap-share-foot-row">
                  <button type="button" onClick={() => handleShare('whatsapp')} className="ap-share-btn ap-share-wa">WhatsApp</button>
                  <button type="button" onClick={() => handleShare('twitter')} className="ap-share-btn ap-share-tw">X (Twitter)</button>
                </div>
              </div>

            </article>

            {/* ──── COMMENTS ──── */}
            <section className="ap-cmt-sec">
              <h3 className="ap-cmt-h">पाठकों की राय / टिप्पणियां <span className="ap-cmt-badge">{comments.length}</span></h3>

              {readerUser ? (
                <form onSubmit={handlePostComment} className="ap-cf">
                  <div className="ap-cf-who">
                    <span className="ap-cf-av" style={{ background: primary }}>{(readerUser.name || readerUser.email || 'प').charAt(0)}</span>
                    <span className="ap-cf-name">{readerUser.name || readerUser.email}</span>
                  </div>
                  <textarea required rows={3} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="इस खबर पर अपनी राय लिखें…" className="ap-cf-ta" />
                  <div className="ap-cf-foot">
                    {commentSuccess && <span className="ap-cf-ok">✓ टिप्पणी सबमिट हो गई (एडमिन सत्यापन के बाद दिखेगी)</span>}
                    <button type="submit" disabled={commentSubmitting} className="ap-cf-btn" style={{ background: primary }}>
                      {commentSubmitting ? (<><span className="ap-spin" /> भेजा जा रहा है…</>) : 'टिप्पणी भेजें'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="ap-lp">
                  <span className="ap-lp-ico">💬</span>
                  <p className="ap-lp-t">टिप्पणी करने के लिए कृपया पहले लॉगिन करें।</p>
                  <Link href="/login" className="ap-lp-btn" style={{ background: primary }}>लॉगिन / रजिस्टर करें</Link>
                </div>
              )}

              {comments.length === 0 ? (
                <div className="ap-cmt-nil">अभी कोई टिप्पणी नहीं है। पहली टिप्पणी आप करें!</div>
              ) : (
                <div className="ap-cmt-list">
                  {comments.map((c) => (
                    <div key={c.id} className="ap-cc">
                      <div className="ap-cc-top">
                        <div className="ap-cc-who"><span className="ap-cc-av">{c.userName.charAt(0)}</span><span className="ap-cc-name">{c.userName}</span></div>
                        <time className="ap-cc-date">{c.createdAt}</time>
                      </div>
                      <p className="ap-cc-body">{c.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ──── RELATED ──── */}
            {relatedArticles.length > 0 && (
              <section className="ap-rel">
                <h3 className="ap-rel-h" style={{ borderLeftColor: primary }}>संबंधित खबरें</h3>
                <div className="ap-rel-grid">
                  {relatedArticles.map((rel) => (
                    <Link key={rel.id} href={`/article/${rel.id}?site=${siteSlug}`} className="ap-rel-card">
                      <div className="ap-rel-img-wrap">
                        <img src={rel.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600'} alt={rel.title} className="ap-rel-img" />
                      </div>
                      <div className="ap-rel-info">
                        <span className="ap-rel-cat" style={{ color: primary }}>{rel.category}</span>
                        <h4 className="ap-rel-title">{rel.title}</h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* ──── RIGHT SIDEBAR ──── */}
          <aside className="ap-aside">

            {/* E-Paper */}
            <div className="ap-widget">
              <div className="ap-widget-head">
                <span className="ap-widget-ico">📰</span>
                <b className="ap-widget-title">आज का डिजिटल ई-पेपर</b>
              </div>
              <p className="ap-widget-desc">अपने शहर का आज का संपूर्ण अखबार मोबाइल पर पढ़ें या डाउनलोड करें।</p>
              <Link href={`/epaper?site=${siteSlug}`} className="ap-widget-cta" style={{ background: primary }}>ई-पेपर पढ़ें →</Link>
            </div>

            {/* Trending */}
            <div className="ap-widget">
              <div className="ap-widget-head ap-widget-head-border">
                <span className="ap-widget-ico" style={{ color: primary }}>⚡</span>
                <b className="ap-widget-title">ट्रेंडिंग खबरें</b>
              </div>
              <div className="ap-trend-list">
                {trendingArticles.map((tItem, index) => (
                  <Link key={tItem.id} href={`/article/${tItem.id}?site=${siteSlug}`} className="ap-trend-item">
                    <span className="ap-trend-num">{index + 1}</span>
                    <div className="ap-trend-col">
                      <h5 className="ap-trend-title">{tItem.title}</h5>
                      <span className="ap-trend-views">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {(tItem.views || 0).toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Ad Slot */}
            <div className="ap-ad-slot">
              <span className="ap-ad-ico">📢</span>
              <b className="ap-ad-label">विज्ञापन स्थान</b>
              <span className="ap-ad-size">300 × 250</span>
            </div>

          </aside>

        </div>

        {/* ════════ FOOTER ════════ */}
        <Footer siteName={siteName} primaryColor={primary} logoUrl={siteLogo} tagline={siteTagline} />
      </div>
    </>
  );
}


/* ══════════════════════════════════════════════════════════════
   NORMAL CSS — no framework, no Tailwind, no external library
   Embedded via Next.js built-in <style jsx global>
   ══════════════════════════════════════════════════════════════ */
const allCSS = `

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ap-page {
  min-height: 100vh;
  background: #f4f6f8;
  color: #0f172a;
  font-family: 'Noto Sans Devanagari', 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
}

/* ══════ LOADING ══════ */
.ap-load {
  min-height: 100vh;
  background: #f4f6f8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Sans Devanagari', 'Inter', system-ui, sans-serif;
}
.ap-load-ring { width: 36px; height: 36px; position: relative; margin-bottom: 16px; }
.ap-load-ring div { position: absolute; inset: 0; border: 3px solid transparent; border-top-color: #94a3b8; border-radius: 50%; animation: apR 0.75s cubic-bezier(.5,0,.5,1) infinite; }
.ap-load-ring div:nth-child(2) { animation-delay: -0.15s; opacity: .65; }
.ap-load-ring div:nth-child(3) { animation-delay: -0.3s; opacity: .35; }
@keyframes apR { to { transform: rotate(360deg); } }
.ap-load-t { font-size: 13.5px; color: #94a3b8; font-weight: 500; }

/* ══════ 404 ══════ */
.ap-nil { min-height: 100vh; background: #f4f6f8; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 24px; text-align: center; font-family: 'Noto Sans Devanagari', 'Inter', system-ui, sans-serif; }
.ap-nil-ico { font-size: 52px; opacity: .5; margin-bottom: 4px; }
.ap-nil-h { font-size: 21px; font-weight: 800; color: #1e293b; }
.ap-nil-p { font-size: 14px; color: #64748b; max-width: 340px; line-height: 1.5; }
.ap-nil-btn { display: inline-block; margin-top: 8px; color: #fff; padding: 10px 24px; border-radius: 8px; font-size: 13.5px; font-weight: 700; text-decoration: none; transition: opacity .15s; }
.ap-nil-btn:hover { opacity: .88; }

/* ══════ HEADER ══════ */
.ap-hdr { background: rgba(255,255,255,.92); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid #ebeef3; position: sticky; top: 0; z-index: 100; }
.ap-hdr-in { max-width: 1380px; margin: 0 auto; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.ap-hdr-left { display: flex; align-items: center; gap: 12px; }
.ap-hdr-back { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: var(--p); font-weight: 700; font-size: 14px; padding: 5px 8px 5px 4px; border-radius: 8px; transition: background .15s; }
.ap-hdr-back:hover { background: rgba(0,0,0,.03); }
.ap-hdr-back svg { flex-shrink: 0; }
.ap-hdr-sep { width: 1px; height: 16px; background: #dde2ea; }
.ap-hdr-cat { font-size: 12px; color: #64748b; font-weight: 500; }
.ap-hdr-right { display: flex; align-items: center; gap: 10px; }
.ap-hdr-date { font-size: 12px; color: #94a3b8; font-weight: 500; font-variant-numeric: tabular-nums; }
.ap-hdr-home { background: #f4f6f8; border: 1px solid #dde2ea; padding: 5px 14px; border-radius: 7px; font-size: 12px; color: #334155; text-decoration: none; font-weight: 600; transition: background .15s; }
.ap-hdr-home:hover { background: #ebeef3; }

/* ══════ 2-COL GRID ══════ */
.ap-grid { max-width: 1380px; width: 100%; margin: 0 auto; padding: 24px 20px 52px; flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 28px; align-items: start; }

/* ══════ ARTICLE CARD ══════ */
.ap-left { min-width: 0; }
.ap-card { background: #fff; border-radius: 16px; border: 1px solid #ebeef3; padding: 28px clamp(18px, 4vw, 38px); box-shadow: 0 1px 3px rgba(0,0,0,.025), 0 4px 20px rgba(0,0,0,.015); }

/* Top Row */
.ap-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
.ap-pill { display: inline-block; color: #fff; font-size: 10.5px; font-weight: 700; padding: 4px 12px; border-radius: 5px; letter-spacing: .3px; }
.ap-top-date { font-size: 12px; color: #94a3b8; font-weight: 500; }

/* Title */
.ap-h1 { font-size: clamp(22px, 3.2vw, 34px); font-weight: 900; color: #0c1222; line-height: 1.34; margin: 0 0 20px; letter-spacing: -.3px; }

/* Author + Share Bar */
.ap-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-top: 1px solid #f1f4f8; border-bottom: 1px solid #f1f4f8; margin-bottom: 24px; gap: 14px; flex-wrap: wrap; }
.ap-author { display: flex; align-items: center; gap: 10px; }
.ap-author-av { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 15px; font-weight: 800; flex-shrink: 0; }
.ap-author-col { display: flex; flex-direction: column; }
.ap-author-name { font-size: 13.5px; font-weight: 700; color: #0f172a; line-height: 1.2; }
.ap-author-sub { font-size: 11.5px; color: #94a3b8; font-weight: 500; display: flex; align-items: center; gap: 4px; margin-top: 1px; }
.ap-author-dot { opacity: .4; }
.ap-eye-ico { color: #c0c8d4; }

/* Share Buttons */
.ap-share-row { display: flex; align-items: center; gap: 6px; }
.ap-share-btn { display: inline-flex; align-items: center; gap: 5px; border: none; border-radius: 7px; padding: 6px 12px; font-size: 11.5px; font-weight: 650; cursor: pointer; font-family: inherit; transition: opacity .15s, transform .1s; }
.ap-share-btn:hover { opacity: .88; }
.ap-share-btn:active { transform: scale(.96); }
.ap-share-wa { background: #25D366; color: #fff; }
.ap-share-fb { background: #1877F2; color: #fff; }
.ap-share-tw { background: #0f1419; color: #fff; }
.ap-share-cp { background: #f1f4f8; color: #334155; border: 1px solid #dde2ea; }

/* Hero */
.ap-hero { width: calc(100% + clamp(36px, 8vw, 76px)); margin-left: calc(-1 * clamp(18px, 4vw, 38px)); margin-bottom: 26px; overflow: hidden; background: #0c1222; max-height: 520px; }
.ap-hero-img { width: 100%; height: 100%; object-fit: contain; max-height: 520px; display: block; }

/* Summary */
.ap-summary { border-left: 4px solid; padding: 14px 20px; margin: 0 0 26px; font-size: 15.5px; font-weight: 600; color: #334155; line-height: 1.72; background: #f8f9fb; border-radius: 0 10px 10px 0; font-style: normal; }

/* Body */
.ap-body { font-size: 17px; line-height: 1.88; color: #1e293b; white-space: pre-line; margin-bottom: 32px; }

/* Share Footer */
.ap-share-foot { background: #f8f9fb; border: 1px solid #ebeef3; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.ap-share-foot-t { font-size: 13px; font-weight: 650; color: #475569; }
.ap-share-foot-row { display: flex; gap: 6px; }

/* ══════ COMMENTS ══════ */
.ap-cmt-sec { margin-top: 28px; background: #fff; border-radius: 16px; border: 1px solid #ebeef3; padding: 24px clamp(18px, 3.5vw, 34px); box-shadow: 0 1px 3px rgba(0,0,0,.025); }
.ap-cmt-h { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 18px; display: flex; align-items: center; gap: 9px; }
.ap-cmt-badge { background: #eef1f5; color: #64748b; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }

/* Comment Form */
.ap-cf { margin-bottom: 22px; }
.ap-cf-who { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
.ap-cf-av { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.ap-cf-name { font-size: 13px; font-weight: 650; color: #334155; }
.ap-cf-ta { width: 100%; padding: 12px 14px; border: 1px solid #dde2ea; border-radius: 10px; font-size: 13.5px; font-family: inherit; color: #1e293b; outline: none; resize: vertical; min-height: 78px; background: #f8f9fb; transition: border-color .15s, box-shadow .15s, background .15s; }
.ap-cf-ta:focus { border-color: var(--p); box-shadow: 0 0 0 3px rgba(0,0,0,.03); background: #fff; }
.ap-cf-ta::placeholder { color: #94a3b8; }
.ap-cf-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; gap: 10px; flex-wrap: wrap; }
.ap-cf-ok { color: #059669; font-size: 12px; font-weight: 650; animation: apFU .3s ease; }
@keyframes apFU { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
.ap-cf-btn { display: inline-flex; align-items: center; gap: 6px; color: #fff; border: none; padding: 9px 22px; border-radius: 8px; font-weight: 700; font-size: 12.5px; font-family: inherit; cursor: pointer; transition: opacity .15s; }
.ap-cf-btn:hover { opacity: .9; }
.ap-cf-btn:disabled { opacity: .6; cursor: not-allowed; }
.ap-spin { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: apR .6s linear infinite; }

/* Login Prompt */
.ap-lp { background: #fff; border: 1px dashed #dde2ea; border-radius: 14px; padding: 28px 20px; text-align: center; margin-bottom: 22px; }
.ap-lp-ico { font-size: 28px; display: block; margin-bottom: 6px; opacity: .6; }
.ap-lp-t { font-size: 13.5px; color: #475569; font-weight: 600; margin: 0 0 14px; }
.ap-lp-btn { display: inline-block; color: #fff; padding: 9px 22px; border-radius: 8px; font-size: 12.5px; font-weight: 700; text-decoration: none; transition: opacity .15s; }
.ap-lp-btn:hover { opacity: .88; }

/* No Comments */
.ap-cmt-nil { color: #94a3b8; font-size: 13.5px; text-align: center; padding: 30px 16px; border: 1px dashed #dde2ea; border-radius: 12px; }

/* Comments List */
.ap-cmt-list { display: flex; flex-direction: column; gap: 10px; }
.ap-cc { background: #f8f9fb; border: 1px solid #ebeef3; border-radius: 12px; padding: 14px 16px; transition: border-color .15s; }
.ap-cc:hover { border-color: #d4d9e3; }
.ap-cc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
.ap-cc-who { display: flex; align-items: center; gap: 8px; }
.ap-cc-av { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #6374e0, #8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.ap-cc-name { font-weight: 650; font-size: 13px; color: #1e293b; }
.ap-cc-date { font-size: 11px; color: #94a3b8; font-weight: 500; white-space: nowrap; }
.ap-cc-body { font-size: 13.5px; color: #334155; line-height: 1.6; margin: 0; }

/* ══════ RELATED ══════ */
.ap-rel { margin-top: 28px; }
.ap-rel-h { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 16px; border-left: 4px solid; padding-left: 12px; }
.ap-rel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.ap-rel-card { text-decoration: none; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #ebeef3; display: flex; flex-direction: column; transition: border-color .15s, box-shadow .15s; }
.ap-rel-card:hover { border-color: #d4d9e3; box-shadow: 0 4px 16px rgba(0,0,0,.04); }
.ap-rel-img-wrap { width: 100%; aspect-ratio: 16/10; background: #0c1222; overflow: hidden; }
.ap-rel-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .25s; }
.ap-rel-card:hover .ap-rel-img { transform: scale(1.03); }
.ap-rel-info { padding: 12px 14px; }
.ap-rel-cat { font-size: 10.5px; font-weight: 700; letter-spacing: .2px; }
.ap-rel-title { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 4px 0 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* ══════ SIDEBAR ══════ */
.ap-aside { position: sticky; top: 68px; display: flex; flex-direction: column; gap: 18px; }

/* Widget */
.ap-widget { background: #fff; border: 1px solid #ebeef3; border-radius: 14px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,.02); }
.ap-widget-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.ap-widget-head-border { padding-bottom: 12px; border-bottom: 1px solid #f1f4f8; margin-bottom: 14px; }
.ap-widget-ico { font-size: 17px; line-height: 1; }
.ap-widget-title { font-size: 15px; color: #0f172a; font-weight: 750; }
.ap-widget-desc { font-size: 12.5px; color: #64748b; margin: 0 0 14px; line-height: 1.5; }
.ap-widget-cta { display: block; text-align: center; color: #fff; padding: 9px; border-radius: 8px; font-size: 12.5px; font-weight: 700; text-decoration: none; transition: opacity .15s; }
.ap-widget-cta:hover { opacity: .88; }

/* Trending */
.ap-trend-list { display: flex; flex-direction: column; gap: 14px; }
.ap-trend-item { display: flex; gap: 10px; align-items: flex-start; text-decoration: none; padding: 6px 4px; border-radius: 8px; transition: background .12s; }
.ap-trend-item:hover { background: #f8f9fb; }
.ap-trend-num { font-size: 20px; font-weight: 900; color: #dde2ea; width: 22px; flex-shrink: 0; line-height: 1.1; text-align: center; }
.ap-trend-item:hover .ap-trend-num { color: #c0c8d4; }
.ap-trend-col { flex: 1; min-width: 0; }
.ap-trend-title { font-size: 13px; font-weight: 600; color: #1e293b; margin: 0 0 3px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ap-trend-views { font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 3px; }
.ap-trend-views svg { color: #c0c8d4; }

/* Ad Slot */
.ap-ad-slot { background: #fff; border: 1px dashed #dde2ea; border-radius: 14px; height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #b0b8c4; gap: 4px; }
.ap-ad-ico { font-size: 22px; opacity: .5; }
.ap-ad-label { font-size: 12px; font-weight: 650; }
.ap-ad-size { font-size: 10.5px; opacity: .6; }

/* ══════ RESPONSIVE ══════ */
@media (max-width: 992px) {
  .ap-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
  .ap-aside { position: static !important; }
}
@media (max-width: 640px) {
  .ap-grid { padding: 16px 12px 44px; }
  .ap-card { padding: 16px; border-radius: 12px; }
  .ap-hero { width: calc(100% + 32px); margin-left: -16px; }
  .ap-bar { flex-direction: column; align-items: flex-start; gap: 12px; }
  .ap-share-row { width: 100%; }
  .ap-share-foot { flex-direction: column; align-items: flex-start; }
  .ap-cmt-sec { padding: 16px; border-radius: 12px; }
  .ap-cf-foot { flex-direction: column; align-items: stretch; }
  .ap-cf-btn { justify-content: center; }
  .ap-hdr-right { gap: 6px; }
  .ap-hdr-home { padding: 4px 10px; }
}
@media (max-width: 400px) {
  .ap-grid { padding: 10px 8px 36px; }
  .ap-card { padding: 14px; }
  .ap-h1 { font-size: 20px; }
  .ap-hdr-in { padding: 8px 12px; }
  .ap-hdr-sep, .ap-hdr-cat { display: none; }
  .ap-hero { width: calc(100% + 28px); margin-left: -14px; }
  .ap-rel-grid { grid-template-columns: 1fr; }
}
`;