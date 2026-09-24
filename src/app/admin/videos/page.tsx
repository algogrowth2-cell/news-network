'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

interface VideoItem {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  category?: string;
  siteId?: string;
  description?: string;
  createdAt?: any;
}

const NETWORK_PORTALS = [
  { slug: 'all', name: 'सभी नेटवर्क (All Portals)' },
  { slug: 'the-local-leader', name: 'द लोकल लीडर' },
  { slug: 'bazar-karobar', name: 'बाज़ार कारोबार' },
  { slug: 'golden-pearl-chronicles', name: 'गोल्डन पर्ल क्रॉनिकल्स' },
  { slug: 'state-express', name: 'द प्रोव्यू टाइम्स' },
  { slug: 'desh-ki-aawaz', name: 'देश की आवाज़' },
  { slug: 'jan-chetna-news', name: 'जन भारत न्यूज़' },
  { slug: 'city-bulletin', name: 'NEWS INFO 24' },
  { slug: 'national-spotlight', name: 'डिफेंस न्यूज़' }
];

const VIDEO_CATEGORIES = [
  'ताज़ा बुलेटिन',
  'ग्राउंड रिपोर्ट',
  'राजनीति',
  'व्यापार',
  'अपराध',
  'खेलकूद',
  'विशेष इंटरव्यू'
];

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('all');

  // Form states
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [category, setCategory] = useState(VIDEO_CATEGORIES[0]);
  const [siteId, setSiteId] = useState('the-local-leader'); // Default Portal
  const [description, setDescription] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // YouTube Video ID nikaalne ka function
  const extractYouTubeId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.trim();
  };

  // 1. Fetch live videos
  useEffect(() => {
    setLoading(true);
    const qVideos = query(collection(db, 'videos'));

    const unsubscribe = onSnapshot(
      qVideos,
      (snapshot) => {
        const list: VideoItem[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as VideoItem);
        });
        // Newest first
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setVideos(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching videos:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Add Video with EXACT siteId
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeUrl.trim()) {
      alert('कृपया शीर्षक और YouTube लिंक दर्ज करें!');
      return;
    }

    const yId = extractYouTubeId(youtubeUrl);
    if (!yId) {
      alert('अमान्य YouTube लिंक! कृपया सही वीडियो URL डालें।');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'videos'), {
        title: title.trim(),
        youtubeUrl: youtubeUrl.trim(),
        youtubeId: yId,
        category,
        siteId: siteId.toLowerCase(), // 👉 Specific Selected Portal Save hoga
        description: description.trim() || '',
        createdAt: serverTimestamp()
      });

      setTitle('');
      setYoutubeUrl('');
      setDescription('');
      setShowAddModal(false);
      alert(`✅ वीडियो सफलतापूर्वक "${NETWORK_PORTALS.find(p => p.slug === siteId)?.name}" के लिए अपलोड हो गया!`);
    } catch (err: any) {
      console.error(err);
      alert('त्रुटि: ' + err.message);
    }
    setSubmitting(false);
  };

  // 3. Delete Video
  const handleDeleteVideo = async (id: string, vidTitle: string) => {
    if (!window.confirm(`क्या आप निश्चित रूप से "${vidTitle}" को हटाना चाहते हैं?`)) return;
    try {
      await deleteDoc(doc(db, 'videos', id));
      alert('वीडियो सफलतापूर्वक हटा दी गई!');
    } catch (err: any) {
      alert('हटाने में त्रुटि: ' + err.message);
    }
  };

  const filteredVideos = videos.filter((item) => {
    if (selectedSiteFilter === 'all') return true;
    return item.siteId === selectedSiteFilter || item.siteId === 'all';
  });

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            📹 वीडियो बुलेटिन प्रबंधन (Video Management)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            पोर्टल-वाइज़ वीडियो बुलेटिन अपलोड और मैनेज करें।
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
              cursor: 'pointer'
            }}
          >
            + नया वीडियो जोड़ें
          </button>
        </div>
      </div>

      {/* Videos List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          वीडियो लोड हो रहे हैं…
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className={styles.formCard} style={{ backgroundColor: '#1e242b', borderRadius: '14px', padding: '50px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px', opacity: 0.6 }}>📹</span>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
            इस पोर्टल के लिए कोई वीडियो उपलब्ध नहीं है
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>
            ऊपर दिए गए बटन से इस पोर्टल के लिए नया YouTube वीडियो अपलोड करें।
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            + वीडियो अपलोड करें
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {filteredVideos.map((item) => (
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
              <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${item.youtubeId}`}
                  title={item.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ backgroundColor: '#334155', color: '#f97316', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                    {item.category || 'वीडियो'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                    पोर्टल: {item.siteId === 'all' ? 'All Portals' : item.siteId}
                  </span>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px', lineHeight: 1.4 }}>
                  {item.title}
                </h4>

                {item.description && (
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(item.id, item.title)}
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

      {/* Add Video Modal */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
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
                📹 नया वीडियो बुलेटिन अपलोड करें
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: '#334155', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVideo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* TARGET PORTAL SELECTION (EXPLICIT) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#f97316', marginBottom: '5px', fontWeight: 700 }}>
                  👉 किस वेबसाइट (पोर्टल) पर वीडियो दिखाना है? *
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1.5px solid #ea580c', backgroundColor: '#0f172a', color: '#fff', fontSize: '13.5px', outline: 'none', fontWeight: 600 }}
                >
                  {NETWORK_PORTALS.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>
                <small style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                  यदि आप &apos;द लोकल लीडर&apos; चुनेंगे, तो यह सिर्फ उसी वेबसाइट पर दिखेगा।
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  वीडियो का शीर्षक (Title) *
                </label>
                <input
                  type="text"
                  placeholder="उदा: आज की बड़ी खबर: देखें ग्राउंड रिपोर्ट"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  YouTube Video Link / URL *
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... या https://youtu.be/..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  श्रेणी (Category)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  {VIDEO_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  संक्षिप्त विवरण (Description)
                </label>
                <textarea
                  rows={2}
                  placeholder="वीडियो के बारे में संक्षेप में लिखें..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {submitting ? 'अपलोड हो रहा है…' : 'वीडियो प्रकाशित करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}