'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import Link from 'next/link';
import { collection, doc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeSiteId } from '@/lib/portals';
import { fallbackFor, getActivePortal, isEnglishSlug } from '@/lib/siteTheme';

/*
 * Homepage jaise vigyapan har page par: header banner (728×90), sidebar banner (300×250), classified widget.
 * Sirf manzoor (active/approved) aur isi portal ke (ya 'all' / bina portal) vigyapan.
 */

export interface SiteAd {
  id: string;
  name: string;
  imageUrl: string;
  videoUrl?: string;
  targetUrl: string;
}
export interface SiteClassified {
  id: string;
  title: string;
  category: string;
  city: string;
  price: string;
  contactNumber: string;
  imageUrl: string;
  videoUrl?: string;
}

const LIVE = ['active', 'approved'];
const onPortal = (siteId: unknown, slug: string) => !siteId || siteId === 'all' || normalizeSiteId(siteId) === slug;

/*
 * Ek page view par ek hi baar padho (har component alag-alag Firestore na padhe).
 * Koi vigyapan ek page par do baar nahi: banners[0] upar, banners[1..] beech-beech me; sidebars[0..3] sidebar me.
 * Jagah se zyada vigyapan hon toh har page view par kram badalta hai (shuffle) — sab advertisers ko barabar mauka.
 */
type AdSet = { banners: SiteAd[]; sidebars: SiteAd[]; classifieds: SiteClassified[]; seen: Set<string> };
// Sidebar me kitni 300×250 jagah (khaali jagah par 'यहाँ विज्ञापन दें')
export const SIDEBAR_SLOTS = 4;
const cache = new Map<string, Promise<AdSet>>();

const shuffle = <T,>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
};

function loadAds(slug: string) {
  // Har naye page (URL) par naya kram aur nayi impression ginti
  const key = `${slug}|${typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        const [adSnap, clSnap] = await Promise.all([
          getDocs(query(collection(db, 'ads'), where('status', 'in', LIVE))),
          getDocs(query(collection(db, 'classifieds'), where('status', 'in', LIVE)))
        ]);
        const headers: SiteAd[] = [];
        const feeds: SiteAd[] = [];
        const sidebars: SiteAd[] = [];
        const classifieds: SiteClassified[] = [];
        adSnap.forEach((d) => {
          const x = d.data();
          if (!onPortal(x.siteId, slug)) return;
          const zone = String(x.zone || '').toLowerCase();
          const fmt = String(x.format || x.type || '').toLowerCase();
          if (zone.includes('classified') || fmt.includes('classified')) {
            classifieds.push({
              id: d.id,
              title: x.name || x.title || '',
              category: x.category || '',
              city: x.city || '',
              price: String(x.price || ''),
              contactNumber: x.contactNumber || '',
              imageUrl: x.imageUrl || '',
              videoUrl: x.videoUrl || ''
            });
            return;
          }
          if (!x.imageUrl && !x.videoUrl) return;
          const ad = { id: d.id, name: x.name || x.title || '', imageUrl: x.imageUrl || '', videoUrl: x.videoUrl || '', targetUrl: x.targetUrl || '' };
          if (zone.includes('300') || zone.includes('sidebar') || zone.includes('साइडबार') || fmt === 'sidebar') sidebars.push(ad);
          else if (zone.includes('728') || zone.includes('header') || zone.includes('हेडर') || fmt === 'banner') headers.push(ad);
          else if (zone.includes('feed') || zone.includes('in-article') || zone.includes('banner')) feeds.push(ad);
        });
        clSnap.forEach((d) => {
          const x = d.data();
          if (!onPortal(x.siteId, slug)) return;
          classifieds.unshift({
            id: d.id,
            title: x.title || x.name || '',
            category: x.category || '',
            city: x.city || '',
            price: String(x.price || ''),
            contactNumber: x.contactNumber || '',
            imageUrl: x.imageUrl || '',
            videoUrl: x.videoUrl || ''
          });
        });
        // Upar wali jagah header-banner wale (unhone wahi kharida), phir in-feed; baaki header beech me
        shuffle(headers);
        shuffle(feeds);
        const banners = headers.length ? [headers[0], ...feeds, ...headers.slice(1)] : feeds;
        return { banners, sidebars: shuffle(sidebars), classifieds: classifieds.slice(0, 4), seen: new Set<string>() };
      })().catch((err) => {
        console.error('Ads load error:', err);
        cache.delete(key);
        return { banners: [], sidebars: [], classifieds: [], seen: new Set<string>() };
      })
    );
  }
  return cache.get(key)!;
}

export function useSiteAds(slug: string) {
  const [data, setData] = useState<AdSet | null>(null);
  useEffect(() => {
    if (!slug) return;
    let alive = true;
    loadAds(slug).then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [slug]);
  return data;
}

/** Jo vigyapan sach me dikha, uski impression ek page view me ek hi baar (+1 — rules sirf yahi allow karte hain) */
function useImpression(ads: AdSet | null, ad: SiteAd | null | undefined) {
  useEffect(() => {
    if (!ads || !ad || ads.seen.has(ad.id)) return;
    ads.seen.add(ad.id);
    updateDoc(doc(db, 'ads', ad.id), { impressions: increment(1) }).catch(() => {});
  }, [ads, ad]);
}

/**
 * Vigyapan ka media: video ho toh chupchaap (muted) loop me apne aap chalta hai, warna photo / GIF.
 * Dono fix size ke dabbe me (object-fit: cover) — photo jaisa hi dikhta hai.
 */
export function AdMedia({ ad, alt, className, style }: { ad: { imageUrl?: string; videoUrl?: string }; alt: string; className?: string; style?: React.CSSProperties }) {
  if (ad.videoUrl) {
    return (
      <video
        src={ad.videoUrl}
        poster={ad.imageUrl || undefined}
        className={className}
        style={{ objectFit: 'cover', ...style }}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    );
  }
  return <img src={ad.imageUrl} alt={alt} className={className} style={style} loading="lazy" />;
}

const adClick = (id: string) => updateDoc(doc(db, 'ads', id), { clicks: increment(1) }).catch(() => {});

const CSS = `
.sa-slot{display:flex;align-items:center;justify-content:center;background:#fff;border:1px dashed #d6d3cd;border-radius:10px;color:#aaa;font-size:12px;text-align:center;padding:10px;box-sizing:border-box;width:100%}
.sa-img{display:block;width:100%;border-radius:10px;object-fit:cover;object-position:center}
.sa-box{background:#fff;border:1px solid #eae8e4;border-radius:14px;padding:16px;box-sizing:border-box}
.sa-title{font-size:15px;font-weight:800;margin:0 0 10px;padding-bottom:8px;border-bottom:2px solid}
.sa-cl{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f0eee9}
.sa-cl:last-of-type{border-bottom:0}
.sa-cl-img{width:72px;height:54px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#f1f0ec;display:flex;align-items:center;justify-content:center;font-size:20px}
.sa-cl-t{font-size:13.5px;font-weight:700;margin:0 0 3px;line-height:1.35;color:#1a1a1a}
.sa-cl-m{font-size:11.5px;color:#888}
.sa-call{display:inline-block;margin-top:4px;font-size:12px;font-weight:700;text-decoration:none}
.sa-all{display:block;text-align:center;margin-top:12px;padding:9px;border:1.5px solid;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none}
.sa-layout{width:100%;margin:0 auto;padding:0 16px;box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start}
.sa-main{min-width:0}
.sa-top{padding-top:20px}
.sa-aside{display:flex;flex-direction:column;gap:16px;padding:24px 0 40px}
.sa-cta{flex-direction:column;gap:4px;text-decoration:none;color:#9a968e;transition:border-color .15s,color .15s}
.sa-cta b{font-size:14px;color:#6b675f}
.sa-cta:hover{border-color:#b9b4ab;color:#6b675f}
.sa-inline{margin:18px 0;grid-column:1/-1}
.sa-label{display:block;font-size:10.5px;letter-spacing:.5px;color:#9a968e;text-transform:uppercase;margin-bottom:4px}
@media(max-width:1024px){
  .sa-layout{grid-template-columns:minmax(0,1fr);gap:0}
  .sa-aside{position:static;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));padding:8px 0 32px}
}
@media(max-width:560px){.sa-layout{padding:0 10px}.sa-top{padding-top:12px}}
`;
const Styles = () => <style dangerouslySetInnerHTML={{ __html: CSS }} />;

/** Header banner (728 × 90) */
export function AdBanner({ slug, height = 110 }: { slug: string; height?: number }) {
  const ads = useSiteAds(slug);
  const en = isEnglishSlug(slug);
  const ad = ads?.banners[0];
  useImpression(ads, ad);
  return (
    <>
      <Styles />
      {ad ? (
        <a href={ad.targetUrl || '#'} target="_blank" rel="noopener noreferrer sponsored" data-ad={ad.id} onClick={() => adClick(ad.id)}>
          <AdMedia ad={ad} alt={ad.name || (en ? 'Advertisement' : 'विज्ञापन')} className="sa-img" style={{ height }} />
        </a>
      ) : (
        <Link href={`/advertiser/login?site=${slug}`} className="sa-slot sa-cta" style={{ minHeight: 90 }}>
          <b>📢 {en ? 'Advertise here' : 'यहाँ विज्ञापन दें'}</b>
          <span>728 × 90</span>
        </Link>
      )}
    </>
  );
}

/** Sidebar banner (300 × 250) — index: kaunsi sidebar jagah; khaali ho toh "यहाँ विज्ञापन दें" */
export function AdSide({ slug, index = 0 }: { slug: string; index?: number }) {
  const ads = useSiteAds(slug);
  const en = isEnglishSlug(slug);
  const ad = ads?.sidebars[index];
  useImpression(ads, ad);
  return (
    <>
      <Styles />
      {ad ? (
        <div>
          <span className="sa-label">{en ? 'Advertisement' : 'विज्ञापन'}</span>
          <a href={ad.targetUrl || '#'} target="_blank" rel="noopener noreferrer sponsored" data-ad={ad.id} onClick={() => adClick(ad.id)}>
            <AdMedia ad={ad} alt={ad.name || (en ? 'Advertisement' : 'विज्ञापन')} className="sa-img" style={{ height: 250 }} />
          </a>
        </div>
      ) : (
        <Link href={`/advertiser/login?site=${slug}`} className="sa-slot sa-cta" style={{ minHeight: 250 }}>
          <span style={{ fontSize: 26 }}>📢</span>
          <b>{en ? 'Advertise here' : 'यहाँ विज्ञापन दें'}</b>
          <span>300 × 250</span>
        </Link>
      )}
    </>
  );
}

/** Sidebar ki saari 300×250 jagah ek saath (from..to) */
export function AdSideSlots({ slug, from = 0, to = SIDEBAR_SLOTS }: { slug: string; from?: number; to?: number }) {
  return (
    <>
      {Array.from({ length: Math.max(0, to - from) }, (_, k) => (
        <AdSide key={from + k} slug={slug} index={from + k} />
      ))}
    </>
  );
}

/** Classified vigyapan widget (homepage jaisa) */
export function ClassifiedsWidget({ slug, color = '#ea580c' }: { slug: string; color?: string }) {
  const ads = useSiteAds(slug);
  const en = isEnglishSlug(slug);
  const list = ads?.classifieds || [];
  return (
    <div className="sa-box">
      <Styles />
      <h3 className="sa-title" style={{ borderColor: color }}>📋 {en ? 'Classified Ads' : 'क्लासिफाइड विज्ञापन'}</h3>
      {list.length === 0 ? (
        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{en ? 'No classified ads available right now.' : 'अभी कोई क्लासिफाइड विज्ञापन उपलब्ध नहीं है।'}</p>
      ) : (
        list.map((c) => (
          <div key={c.id} className="sa-cl">
            {c.imageUrl || c.videoUrl ? <AdMedia ad={c} alt={c.title} className="sa-cl-img" /> : <div className="sa-cl-img">📋</div>}
            <div style={{ minWidth: 0 }}>
              <p className="sa-cl-t">{c.title}</p>
              <div className="sa-cl-m">{[c.category, c.city, c.price].filter(Boolean).join(' · ')}</div>
              {c.contactNumber && (
                <a href={`tel:${c.contactNumber}`} className="sa-call" style={{ color }}>
                  📞 {c.contactNumber}
                </a>
              )}
            </div>
          </div>
        ))
      )}
      <Link href={`/classifieds?site=${slug}`} className="sa-all" style={{ color, borderColor: color }}>
        {en ? 'View All Classifieds →' : 'सभी क्लासिफाइड देखें →'}
      </Link>
    </div>
  );
}

/**
 * Smart sticky sidebar: chhota ho toh upar chipka; lamba ho toh pehle poora scroll hota hai aur
 * aakhri vigyapan screen ke neeche aane par wahin ruk jaata hai — lambe content ke saath kabhi khaali jagah nahi,
 * aur koi vigyapan chhupta nahi. Mobile/tablet (ek column) par normal.
 */
export function useStickySidebar(ref: RefObject<HTMLElement | null>, { top = 84, minWidth = 1025 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      if (window.innerWidth < minWidth) {
        el.style.position = '';
        el.style.top = '';
        return;
      }
      el.style.position = 'sticky';
      el.style.alignSelf = 'start';
      el.style.top = `${Math.min(top, window.innerHeight - el.offsetHeight - 16)}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, [ref, top, minWidth]);
}

/** Smart sticky <aside> (jahan aside baad me render hota hai, jaise article page) */
export function StickyAside({ className, children, top, minWidth }: { className?: string; children: React.ReactNode; top?: number; minWidth?: number }) {
  const ref = useRef<HTMLElement>(null);
  useStickySidebar(ref, { top, minWidth });
  return (
    <aside className={className} ref={ref}>
      {children}
    </aside>
  );
}

/** Portal: diya ho toh wahi, warna ?site= / domain / pichhla portal (browser me) */
function useResolvedSlug(slug?: string) {
  const [s, setS] = useState(slug || '');
  useEffect(() => {
    setS(slug || getActivePortal(new URLSearchParams(window.location.search).get('site')));
  }, [slug]);
  return s;
}

/** Beech-beech ka banner (list / khabar ke darmiyan) — in-feed vigyapan, na ho toh header banner; khaali ho toh kuch nahi */
export function AdInline({ slug, index = 0 }: { slug?: string; index?: number }) {
  const s = useResolvedSlug(slug);
  const ads = useSiteAds(s);
  const en = isEnglishSlug(s);
  // Upar wala banner [0] hai; beech ki har jagah alag vigyapan (repeat nahi)
  const ad = ads?.banners[index + 1];
  useImpression(ads, ad);
  if (!ads) return null;
  if (!ad) {
    // Sirf pehli khaali jagah par "यहाँ विज्ञापन दें" — baaki khaali jagah chhup jaati hain
    if (!ads.banners.length || index + 1 !== ads.banners.length) return null;
    return (
      <div className="sa-inline">
        <Styles />
        <Link href={`/advertiser/login?site=${s}`} className="sa-slot sa-cta" style={{ minHeight: 90 }}>
          <b>📢 {en ? 'Advertise here' : 'यहाँ विज्ञापन दें'}</b>
          <span>728 × 90</span>
        </Link>
      </div>
    );
  }
  return (
    <div className="sa-inline">
      <Styles />
      <span className="sa-label">{en ? 'Advertisement' : 'विज्ञापन'}</span>
      <a href={ad.targetUrl || '#'} target="_blank" rel="noopener noreferrer sponsored" data-ad={ad.id} onClick={() => adClick(ad.id)}>
        <AdMedia ad={ad} alt={ad.name || (en ? 'Advertisement' : 'विज्ञापन')} className="sa-img" style={{ height: 110 }} />
      </a>
    </div>
  );
}

/**
 * Homepage jaisa page layout: upar banner + content, right sidebar me 300×250 + classifieds.
 * Tablet/mobile par sidebar content ke neeche.
 */
export function AdLayout({ slug, color, children, top = true, maxWidth = 1380 }: { slug?: string; color?: string; children: React.ReactNode; top?: boolean; maxWidth?: number }) {
  const s = useResolvedSlug(slug);
  const asideRef = useRef<HTMLElement>(null);
  useStickySidebar(asideRef);
  return (
    <div className="sa-layout" style={{ maxWidth }}>
      <Styles />
      <div className="sa-main">
        {top && s && (
          <div className="sa-top">
            <AdBanner slug={s} />
          </div>
        )}
        {children}
      </div>
      <aside className="sa-aside" ref={asideRef}>
        {s && (
          <>
            <AdSideSlots slug={s} from={0} to={2} />
            <ClassifiedsWidget slug={s} color={color || fallbackFor(s).primaryColor} />
            <AdSideSlots slug={s} from={2} to={SIDEBAR_SLOTS} />
          </>
        )}
      </aside>
    </div>
  );
}
