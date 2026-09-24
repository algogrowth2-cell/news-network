'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Footer from '@/components/Footer';

interface ClassifiedItem {
  id: string;
  title: string;
  category?: string;
  city?: string;
  state?: string;
  price?: string;
  description?: string;
  contactNumber?: string;
  email?: string;
  imageUrl?: string;
  siteId?: string;
  createdAt?: string;
  status?: string;
}

const CLASSIFIED_CATEGORIES = [
  'सभी',
  'प्रॉपर्टी / ज़मीन',
  'वाहन (गाड़ियां)',
  'नौकरी / रोजगार',
  'इलेक्ट्रॉनिक्स',
  'सेवाएं / बिजनेस',
  'शिक्षा / कोचिंग',
  'अन्य'
];

export default function ClassifiedsPage() {
  const searchParams = useSearchParams();
  const [siteSlug, setSiteSlug] = useState('the-local-leader');
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [classifieds, setClassifieds] = useState<ClassifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('सभी');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAd, setSelectedAd] = useState<ClassifiedItem | null>(null);

  // 1. Identify Site Slug from query
  useEffect(() => {
    const qSite = searchParams.get('site') || 'the-local-leader';
    setSiteSlug(qSite.toLowerCase());
  }, [searchParams]);

  // 2. Fetch Live Site Config
  useEffect(() => {
    if (!siteSlug) return;
    const unsub = onSnapshot(doc(db, 'sites', siteSlug), (snap) => {
      if (snap.exists()) {
        setSiteConfig({ slug: siteSlug, ...snap.data() });
      } else {
        setSiteConfig({
          slug: siteSlug,
          name: 'द लोकल लीडर',
          primaryColor: '#ea580c',
          logoUrl: `/logos/${siteSlug}.jpeg`,
          description: '— जनता की आवाज़, सच्चाई के साथ —'
        });
      }
    });
    return () => unsub();
  }, [siteSlug]);

  // 3. Fetch Live Classifieds from Firebase
  useEffect(() => {
    setLoading(true);
    // Fetch active/approved classifieds
    const qCls = query(collection(db, 'classifieds'));
    const unsub = onSnapshot(
      qCls,
      (snap) => {
        const list: ClassifiedItem[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const st = String(data.status || 'active').toLowerCase();
          if (st === 'active' || st === 'approved') {
            // Agar siteId match ho ya all-network public ho
            if (!data.siteId || data.siteId.toLowerCase() === siteSlug || data.siteId === 'all') {
              list.push({ id: d.id, ...data } as ClassifiedItem);
            }
          }
        });
        setClassifieds(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching classifieds:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [siteSlug]);

  const primary = siteConfig?.primaryColor || '#ea580c';
  const siteName = siteConfig?.name || 'द लोकल लीडर';
  const siteLogo = siteConfig?.logoUrl || `/logos/${siteSlug}.jpeg`;
  const siteTagline = siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —';

  // Filter ads
  const filteredAds = classifieds.filter((item) => {
    const matchesCat =
      selectedCategory === 'सभी' ||
      (item.category && item.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (selectedCategory.includes('प्रॉपर्टी') && (item.category?.includes('Property') || item.category?.includes('जमीन'))) ||
      (selectedCategory.includes('वाहन') && (item.category?.includes('Vehicle') || item.category?.includes('गाड़ी'))) ||
      (selectedCategory.includes('नौकरी') && (item.category?.includes('Job') || item.category?.includes('रोजगार')));

    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !cleanSearch ||
      item.title?.toLowerCase().includes(cleanSearch) ||
      item.city?.toLowerCase().includes(cleanSearch) ||
      item.description?.toLowerCase().includes(cleanSearch);

    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: '"Mukta", system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── TOP HEADER BAR ── */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href={`/?site=${siteSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: primary, textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
              <span style={{ fontSize: '18px' }}>←</span>
              <span>{siteName}</span>
            </Link>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>📋</span>
              <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>वर्गीकृत विज्ञापन (Classifieds)</h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/advertiser/login"
              style={{
                backgroundColor: primary,
                color: '#ffffff',
                textDecoration: 'none',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📢</span>
              <span>विज्ञापन दें (Advertiser Portal)</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main style={{ maxWidth: '1380px', width: '100%', margin: '0 auto', padding: '24px 16px 48px', flex: 1 }}>
        
        {/* Banner Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px 20px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ maxWidth: '700px' }}>
            <span style={{ backgroundColor: `${primary}15`, color: primary, fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase' }}>
              लोकल मार्केट एवं वर्गीकृत सेवाएं
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '10px 0 6px' }}>
              अपने शहर और क्षेत्र के ताज़ा क्लासिफाइड विज्ञापन
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 16px' }}>
              प्रॉपर्टी, वाहन, नौकरी, व्यवसाय और अन्य सेवाओं के लिए सीधे संपर्क करें।
            </p>
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', gap: '10px', maxWidth: '560px' }}>
            <input
              type="text"
              placeholder="शहर, प्रॉपर्टी या विज्ञापन का विषय खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                outline: 'none',
                backgroundColor: '#f8fafc'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', fontSize: '12px' }}
              >
                हटाएं
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap', marginBottom: '24px', paddingBottom: '4px' }}>
          {CLASSIFIED_CATEGORIES.map((cat) => {
            const isAct = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  backgroundColor: isAct ? primary : '#ffffff',
                  color: isAct ? '#ffffff' : '#334155',
                  border: `1px solid ${isAct ? primary : '#e2e8f0'}`,
                  borderRadius: '20px',
                  padding: '7px 16px',
                  fontSize: '13px',
                  fontWeight: isAct ? 700 : 500,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Ads Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span>क्लासिफाइड लोड हो रहे हैं…</span>
          </div>
        ) : filteredAds.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px', opacity: 0.6 }}>📢</span>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
              {searchTerm ? `"${searchTerm}" के लिए कोई विज्ञापन नहीं मिला` : 'अभी इस श्रेणी में कोई सक्रिय विज्ञापन नहीं है'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', margin: '0 auto 18px' }}>
              अपना विज्ञापन नेटवर्क के हजारों पाठकों तक पहुंचाने के लिए विज्ञापनदाता पोर्टल पर जाएं।
            </p>
            <Link
              href="/advertiser/login"
              style={{
                backgroundColor: primary,
                color: '#fff',
                padding: '9px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-block'
              }}
            >
              + नया विज्ञापन दर्ज करें
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredAds.map((ad) => (
              <div
                key={ad.id}
                onClick={() => setSelectedAd(ad)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                }}
              >
                {/* Image */}
                <div style={{ width: '100%', height: '170px', backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                  {ad.imageUrl ? (
                    <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '38px', opacity: 0.5 }}>
                      🏷️
                    </div>
                  )}
                  {ad.city && (
                    <span style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '10.5px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px' }}>
                      📍 {ad.city}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: primary, textTransform: 'uppercase' }}>
                      {ad.category || 'वर्गीकृत'}
                    </span>
                    {ad.price && (
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>
                        ₹{ad.price}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ad.title}
                  </h3>

                  {ad.description && (
                    <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ad.description}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>{ad.createdAt || 'आज'}</span>
                    <button
                      type="button"
                      style={{
                        backgroundColor: '#f1f5f9',
                        color: primary,
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      संपर्क देखें →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* ── DETAIL MODAL POPUP ── */}
      {selectedAd && (
        <div
          onClick={() => setSelectedAd(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: primary, textTransform: 'uppercase' }}>
                {selectedAd.category} {selectedAd.city ? `· ${selectedAd.city}` : ''}
              </span>
              <button
                type="button"
                onClick={() => setSelectedAd(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {selectedAd.imageUrl && (
              <div style={{ width: '100%', borderRadius: '10px', overflow: 'hidden', maxHeight: '260px', marginBottom: '16px' }}>
                <img src={selectedAd.imageUrl} alt={selectedAd.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.35 }}>
              {selectedAd.title}
            </h3>

            {selectedAd.price && (
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginBottom: '12px' }}>
                कीमत: ₹{selectedAd.price}
              </div>
            )}

            <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, marginBottom: '20px', whiteSpace: 'pre-line' }}>
              {selectedAd.description || 'विवरण उपलब्ध नहीं है।'}
            </p>

            {/* Contact Details Box */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <b style={{ fontSize: '13px', color: '#0f172a' }}>विज्ञापनदाता संपर्क विवरण:</b>
              {selectedAd.contactNumber ? (
                <a
                  href={`tel:${selectedAd.contactNumber}`}
                  style={{ color: '#ffffff', backgroundColor: '#25D366', textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textAlign: 'center', display: 'block' }}
                >
                  📞 कॉल करें: {selectedAd.contactNumber}
                </a>
              ) : (
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>फोन नंबर उपलब्ध नहीं है</span>
              )}
              {selectedAd.email && (
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>ईमेल: {selectedAd.email}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <Footer siteName={siteName} primaryColor={primary} logoUrl={siteLogo} tagline={siteTagline} />
    </div>
  );
}