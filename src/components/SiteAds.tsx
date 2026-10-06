'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, doc, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeSiteId } from '@/lib/portals';
import { isEnglishSlug } from '@/lib/siteTheme';

/*
 * Homepage jaise vigyapan har page par: header banner (728×90), sidebar banner (300×250), classified widget.
 * Sirf manzoor (active/approved) aur isi portal ke (ya 'all' / bina portal) vigyapan.
 */

export interface SiteAd {
  id: string;
  name: string;
  imageUrl: string;
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
}

const LIVE = ['active', 'approved'];
const onPortal = (siteId: unknown, slug: string) => !siteId || siteId === 'all' || normalizeSiteId(siteId) === slug;

// Ek page load par ek hi baar padho (har component alag-alag Firestore na padhe)
const cache = new Map<string, Promise<{ header: SiteAd | null; sidebar: SiteAd | null; classifieds: SiteClassified[] }>>();

function loadAds(slug: string) {
  if (!cache.has(slug)) {
    cache.set(
      slug,
      (async () => {
        const [adSnap, clSnap] = await Promise.all([
          getDocs(query(collection(db, 'ads'), where('status', 'in', LIVE))),
          getDocs(query(collection(db, 'classifieds'), where('status', 'in', LIVE)))
        ]);
        let header: SiteAd | null = null;
        let sidebar: SiteAd | null = null;
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
              imageUrl: x.imageUrl || ''
            });
            return;
          }
          if (!x.imageUrl) return;
          const ad = { id: d.id, name: x.name || x.title || '', imageUrl: x.imageUrl, targetUrl: x.targetUrl || '' };
          if (!header && (zone.includes('728') || zone.includes('header') || zone.includes('हेडर') || fmt === 'banner')) header = ad;
          else if (!sidebar && (zone.includes('300') || zone.includes('sidebar') || zone.includes('साइडबार') || fmt === 'sidebar')) sidebar = ad;
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
            imageUrl: x.imageUrl || ''
          });
        });
        // Dikhne wale vigyapanon ki impression (+1) — rules sirf yahi badlaav allow karte hain
        for (const ad of [header, sidebar] as (SiteAd | null)[]) if (ad) updateDoc(doc(db, 'ads', ad.id), { impressions: increment(1) }).catch(() => {});
        return { header, sidebar, classifieds: classifieds.slice(0, 4) };
      })().catch((err) => {
        console.error('Ads load error:', err);
        cache.delete(slug);
        return { header: null, sidebar: null, classifieds: [] };
      })
    );
  }
  return cache.get(slug)!;
}

export function useSiteAds(slug: string) {
  const [data, setData] = useState<{ header: SiteAd | null; sidebar: SiteAd | null; classifieds: SiteClassified[] } | null>(null);
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

const adClick = (id: string) => updateDoc(doc(db, 'ads', id), { clicks: increment(1) }).catch(() => {});

const CSS = `
.sa-slot{display:flex;align-items:center;justify-content:center;background:#fff;border:1px dashed #d6d3cd;border-radius:10px;color:#aaa;font-size:12px;text-align:center;padding:10px;box-sizing:border-box;width:100%}
.sa-img{display:block;width:100%;border-radius:10px;object-fit:cover;object-position:center}
.sa-box{background:#fff;border:1px solid #eae8e4;border-radius:14px;padding:16px;box-sizing:border-box}
.sa-title{font-size:15px;font-weight:800;margin:0 0 10px;padding-bottom:8px;border-bottom:2px solid}
.sa-cl{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f0eee9}
.sa-cl:last-of-type{border-bottom:0}
.sa-cl-img{width:54px;height:54px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#f1f0ec;display:flex;align-items:center;justify-content:center;font-size:20px}
.sa-cl-t{font-size:13.5px;font-weight:700;margin:0 0 3px;line-height:1.35;color:#1a1a1a}
.sa-cl-m{font-size:11.5px;color:#888}
.sa-call{display:inline-block;margin-top:4px;font-size:12px;font-weight:700;text-decoration:none}
.sa-all{display:block;text-align:center;margin-top:12px;padding:9px;border:1.5px solid;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none}
.sa-strip{max-width:1320px;margin:0 auto;padding:24px 16px 8px;box-sizing:border-box;width:100%;display:flex;flex-direction:column;gap:16px}
.sa-strip-row{display:grid;grid-template-columns:300px minmax(0,1fr);gap:16px;align-items:start}
@media(max-width:720px){.sa-strip-row{grid-template-columns:1fr}.sa-strip{padding:16px 12px 4px}}
`;
const Styles = () => <style dangerouslySetInnerHTML={{ __html: CSS }} />;

/** Header banner (728 × 90) */
export function AdBanner({ slug, height = 110 }: { slug: string; height?: number }) {
  const ads = useSiteAds(slug);
  const en = isEnglishSlug(slug);
  const ad = ads?.header;
  return (
    <>
      <Styles />
      {ad ? (
        <a href={ad.targetUrl || '#'} target="_blank" rel="noopener noreferrer sponsored" onClick={() => adClick(ad.id)}>
          <img src={ad.imageUrl} alt={ad.name || (en ? 'Advertisement' : 'विज्ञापन')} className="sa-img" style={{ height }} />
        </a>
      ) : (
        <div className="sa-slot" style={{ minHeight: 90 }}>{en ? 'Advertisement' : 'विज्ञापन'} · 728 × 90</div>
      )}
    </>
  );
}

/** Sidebar banner (300 × 250) */
export function AdSide({ slug }: { slug: string }) {
  const ads = useSiteAds(slug);
  const en = isEnglishSlug(slug);
  const ad = ads?.sidebar;
  return (
    <>
      <Styles />
      {ad ? (
        <a href={ad.targetUrl || '#'} target="_blank" rel="noopener noreferrer sponsored" onClick={() => adClick(ad.id)}>
          <img src={ad.imageUrl} alt={ad.name || (en ? 'Advertisement' : 'विज्ञापन')} className="sa-img" style={{ height: 250 }} />
        </a>
      ) : (
        <div className="sa-slot" style={{ minHeight: 250 }}>{en ? 'Advertisement' : 'विज्ञापन'} · 300 × 250</div>
      )}
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
            {c.imageUrl ? <img src={c.imageUrl} alt={c.title} className="sa-cl-img" /> : <div className="sa-cl-img">📋</div>}
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

/** Jin pages par sidebar nahi: footer ke upar banner + 300×250 + classifieds ek saath */
export function AdsStrip({ slug, color }: { slug: string; color?: string }) {
  return (
    <section className="sa-strip" aria-label={isEnglishSlug(slug) ? 'Advertisements' : 'विज्ञापन'}>
      <Styles />
      <AdBanner slug={slug} />
      <div className="sa-strip-row">
        <AdSide slug={slug} />
        <ClassifiedsWidget slug={slug} color={color} />
      </div>
    </section>
  );
}
