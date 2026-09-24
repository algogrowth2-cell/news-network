'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category?: string;
  siteId?: string;
  caption?: string;
  createdAt?: any;
}

const NETWORK_PORTALS = [
  { slug: 'all', name: 'सभी नेटवर्क पोर्टल्स (All Portals)' },
  { slug: 'the-local-leader', name: 'द लोकल लीडर' },
  { slug: 'bazar-karobar', name: 'बाज़ार कारोबार' },
  { slug: 'golden-pearl-chronicles', name: 'गोल्डन पर्ल क्रॉनिकल्स' },
  { slug: 'state-express', name: 'द प्रोव्यू टाइम्स' },
  { slug: 'desh-ki-aawaz', name: 'देश की आवाज़' },
  { slug: 'jan-chetna-news', name: 'जन भारत न्यूज़' },
  { slug: 'city-bulletin', name: 'NEWS INFO 24' },
  { slug: 'national-spotlight', name: 'डिफेंस न्यूज़' }
];

const GALLERY_CATEGORIES = [
  'ताज़ा कार्यक्रम',
  'राजनीति एवं रैलियां',
  'खेलकूद एवं प्रतियोगिता',
  'सांस्कृतिक एवं पर्व',
  'विकास एवं निर्माण',
  'अन्य फोटो'
];

export default function AdminGalleriesPage() {
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('all');

  // Form states
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState(GALLERY_CATEGORIES[0]);
  const [siteId, setSiteId] = useState('the-local-leader');
  const [showAddModal, setShowAddModal] = useState(false);

  // 1. Live Fetch Galleries from Firestore
  useEffect(() => {
    setLoading(true);
    const qGalleries = query(collection(db, 'galleries'));

    const unsubscribe = onSnapshot(
      qGalleries,
      (snapshot) => {
        const list: GalleryItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as GalleryItem);
        });
        // Sort newest first
        list.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        setGalleries(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching galleries:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Add New Photo to Gallery
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      alert('कृपया फोटो का शीर्षक और Image URL दर्ज करें!');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'galleries'), {
        title: title.trim(),
        imageUrl: imageUrl.trim(),
        caption: caption.trim() || title.trim(),
        category,
        siteId,
        createdAt: serverTimestamp()
      });

      // Reset
      setTitle('');
      setImageUrl('');
      setCaption('');
      setShowAddModal(false);
      alert('फोटो गैलरी सफलतापूर्वक अपलोड हो गई!');
    } catch (err: any) {
      console.error('Error adding to gallery:', err);
      alert('अपलोड में त्रुटि: ' + err.message);
    }
    setSubmitting(false);
  };

  // 3. Delete Photo
  const handleDeletePhoto = async (id: string, photoTitle: string) => {
    if (!window.confirm(`क्या आप निश्चित रूप से "${photoTitle}" को गैलरी से हटाना चाहते हैं?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'galleries', id));
      alert('फोटो सफलतापूर्वक हटा दी गई!');
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('हटाने में त्रुटि: ' + err.message);
    }
  };

  // Filtered List
  const filteredGalleries = galleries.filter((item) => {
    if (selectedSiteFilter === 'all') return true;
    return item.siteId === selectedSiteFilter || item.siteId === 'all';
  });

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            📸 फोटो गैलरी प्रबंधन (Photo Galleries)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            वेबसाइट एवं नेटवर्क पोर्टल्स के लिए फोटो गैलरी अपलोड और प्रबंधित करें।
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Portal Filter */}
          <select
            value={selectedSiteFilter}
            onChange={(e) => setSelectedSiteFilter(e.target.value)}
            style={{
              backgroundColor: '#1e242b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {NETWORK_PORTALS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>+</span> नई फोटो जोड़ें
          </button>
        </div>
      </div>

      {/* Gallery Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          गैलरी लोड हो रही है…
        </div>
      ) : filteredGalleries.length === 0 ? (
        <div className={styles.formCard} style={{ backgroundColor: '#1e242b', borderRadius: '14px', padding: '50px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px', opacity: 0.6 }}>🖼️</span>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
            अभी कोई फोटो गैलरी उपलब्ध नहीं है
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>
            अपने पोर्टल के लिए ऊपर दिए गए बटन से नई फोटो अपलोड करें।
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#ea580c',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + फोटो अपलोड करें
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {filteredGalleries.map((item) => (
            <div
              key={item.id}
              className={styles.formCard}
              style={{
                backgroundColor: '#1e242b',
                borderRadius: '12px',
                border: '1px solid #334155',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ width: '100%', height: '180px', backgroundColor: '#0f172a', position: 'relative' }}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800';
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: '#ea580c',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {item.category || 'गैलरी'}
                </span>
              </div>

              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px', lineHeight: 1.4 }}>
                  {item.title}
                </h4>
                {item.caption && (
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.5 }}>
                    {item.caption}
                  </p>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    पोर्टल: <b>{item.siteId || 'all'}</b>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(item.id, item.title)}
                    style={{
                      backgroundColor: '#ef444422',
                      color: '#ef4444',
                      border: '1px solid #ef444444',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    हटाएं ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Modal */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1e242b',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              border: '1px solid #334155',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                📸 नई फोटो गैलरी अपलोड करें
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: '#334155', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPhoto} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  फोटो का शीर्षक (Title) *
                </label>
                <input
                  type="text"
                  placeholder="उदा: इंदौर विकास कार्य एवं नए ब्रिज का लोकार्पण"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Image URL (Direct link) *
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    श्रेणी (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px', outline: 'none' }}
                  >
                    {GALLERY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    पोर्टल (Site)
                  </label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px', outline: 'none' }}
                  >
                    {NETWORK_PORTALS.map((p) => (
                      <option key={p.slug} value={p.slug}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  संक्षिप्त विवरण / कैप्शन (Caption)
                </label>
                <textarea
                  rows={2}
                  placeholder="फोटो के संदर्भ में एक या दो लाइन विवरण..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' }}
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {submitting ? 'अपलोड हो रहा है…' : 'गैलरी में जोड़ें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}