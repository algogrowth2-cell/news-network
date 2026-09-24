'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

interface UpdateItem {
  id: string;
  time: string;
  update: string;
}

interface LiveBlogData {
  id: string;
  title: string;
  siteId: string;
  youtubeUrl: string;
  youtubeId: string;
  isActive: boolean;
  updates: UpdateItem[];
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

export default function LiveBlogsPage() {
  const [liveStreams, setLiveStreams] = useState<LiveBlogData[]>([]);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('all');

  // Form states for creating a new stream
  const [newTitle, setNewTitle] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [newSiteId, setNewSiteId] = useState('all');
  const [saving, setSaving] = useState(false);

  // Quick update text per stream
  const [postTexts, setPostTexts] = useState<Record<string, string>>({});

  const extractYouTubeId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.trim();
  };

  // Live Firestore listener for collection 'live_blogs'
  useEffect(() => {
    const qStreams = query(collection(db, 'live_blogs'));
    const unsub = onSnapshot(qStreams, (snap) => {
      const list: LiveBlogData[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as LiveBlogData);
      });
      // Sort: active first, then newest
      list.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));
      setLiveStreams(list);
    });
    return () => unsub();
  }, []);

  // Add a new live stream
  const handleCreateLiveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newYoutubeUrl.trim()) {
      alert('कृपया शीर्षक और YouTube URL भरें!');
      return;
    }

    const yId = extractYouTubeId(newYoutubeUrl);
    if (!yId) {
      alert('अमान्य YouTube URL! कृपया सही वीडियो या लाइव लिंक डालें।');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'live_blogs'), {
        title: newTitle.trim(),
        siteId: newSiteId,
        youtubeUrl: newYoutubeUrl.trim(),
        youtubeId: yId,
        isActive: true,
        updates: [],
        createdAt: serverTimestamp()
      });

      setNewTitle('');
      setNewYoutubeUrl('');
      alert('नई लाइव स्ट्रीम सफलतापूर्वक शुरू हो गई!');
    } catch (err: any) {
      console.error(err);
      alert('त्रुटि: ' + err.message);
    }
    setSaving(false);
  };

  // Toggle Live status (Start / Stop)
  const handleToggleActive = async (item: LiveBlogData) => {
    try {
      await updateDoc(doc(db, 'live_blogs', item.id), {
        isActive: !item.isActive,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      alert('त्रुटि: ' + err.message);
    }
  };

  // Delete a stream
  const handleDeleteStream = async (id: string, streamTitle: string) => {
    if (!window.confirm(`क्या आप निश्चित रूप से "${streamTitle}" को हटाना चाहते हैं?`)) return;
    try {
      await deleteDoc(doc(db, 'live_blogs', id));
      alert('लाइव स्ट्रीम हटा दी गई!');
    } catch (err: any) {
      alert('त्रुटि: ' + err.message);
    }
  };

  // Post a quick bullet text update
  const handlePostBullet = async (streamId: string) => {
    const text = postTexts[streamId]?.trim();
    if (!text) return;

    const newBullet: UpdateItem = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      update: text
    };

    try {
      await updateDoc(doc(db, 'live_blogs', streamId), {
        updates: arrayUnion(newBullet),
        updatedAt: serverTimestamp()
      });
      setPostTexts(prev => ({ ...prev, [streamId]: '' }));
    } catch (err: any) {
      alert('अपडेट पोस्ट करने में त्रुटि: ' + err.message);
    }
  };

  const filteredStreams = liveStreams.filter(item => {
    if (selectedSiteFilter === 'all') return true;
    return item.siteId === selectedSiteFilter || item.siteId === 'all';
  });

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            🔴 मल्टीपल लाइव स्ट्रीम्स (Multi Live Manager)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            एक साथ कई YouTube लाइव स्ट्रीम्स को अलग-अलग या सभी पोर्टल्स पर लाइव करें और रोकें।
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>फिल्टर पोर्टल:</span>
          <select
            value={selectedSiteFilter}
            onChange={(e) => setSelectedSiteFilter(e.target.value)}
            style={{
              backgroundColor: '#1e242b',
              color: '#fff',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {NETWORK_PORTALS.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CREATE NEW LIVE STREAM FORM */}
      <div className={styles.formCard} style={{ backgroundColor: '#1e242b', borderRadius: '14px', padding: '20px', marginBottom: '28px', border: '1px solid #334155' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>+</span> नई लाइव स्ट्रीम जोड़ें (Add New Stream)
        </h2>

        <form onSubmit={handleCreateLiveStream} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px', fontWeight: 600 }}>
              लाइव का शीर्षक (Title) *
            </label>
            <input
              type="text"
              placeholder="उदा: ग्राउंड रिपोर्ट: आज की बड़ी चुनावी रैली लाइव"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px', fontWeight: 600 }}>
              YouTube Live / Video Link *
            </label>
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=... या https://youtu.be/..."
              value={newYoutubeUrl}
              onChange={(e) => setNewYoutubeUrl(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '5px', fontWeight: 600 }}>
              टारगेट पोर्टल
            </label>
            <select
              value={newSiteId}
              onChange={(e) => setNewSiteId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px', outline: 'none' }}
            >
              {NETWORK_PORTALS.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                backgroundColor: '#ea580c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '11px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {saving ? 'शुरू हो रही है…' : '🚀 वेबसाइट पर लाइव करें'}
            </button>
          </div>
        </form>
      </div>

      {/* ACTIVE & SAVED STREAMS LIST */}
      <div>
        <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', color: '#f8fafc' }}>
          वर्तमान लाइव स्ट्रीम्स ({filteredStreams.length})
        </h2>

        {filteredStreams.length === 0 ? (
          <div className={styles.formCard} style={{ backgroundColor: '#1e242b', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            अभी कोई लाइव स्ट्रीम सक्रिय नहीं है। ऊपर दिए गए फॉर्म से नई लाइव स्ट्रीम जोड़ें।
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredStreams.map((stream) => (
              <div
                key={stream.id}
                className={styles.formCard}
                style={{
                  backgroundColor: '#1e242b',
                  borderRadius: '14px',
                  border: `1.5px solid ${stream.isActive ? '#ef4444' : '#334155'}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Header status bar */}
                <div style={{ padding: '10px 16px', backgroundColor: stream.isActive ? '#ef444415' : '#0f172a', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: stream.isActive ? '#ef4444' : '#64748b' }} />
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: stream.isActive ? '#ef4444' : '#94a3b8' }}>
                      {stream.isActive ? '🔴 LIVE ACTIVE' : '⏹️ PAUSED / STOPPED'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#cbd5e1', backgroundColor: '#334155', padding: '2px 8px', borderRadius: '10px' }}>
                    {stream.siteId === 'all' ? 'All Portals' : stream.siteId}
                  </span>
                </div>

                {/* Video Iframe Preview */}
                <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: '#000' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${stream.youtubeId}`}
                    title={stream.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Stream Info & Controls */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: '0 0 14px 0', color: '#f8fafc', lineHeight: 1.35 }}>
                    {stream.title}
                  </h3>

                  {/* Action Buttons: Stop / Start / Delete */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(stream)}
                      style={{
                        flex: 1,
                        backgroundColor: stream.isActive ? '#f9731622' : '#22c55e22',
                        color: stream.isActive ? '#f97316' : '#22c55e',
                        border: `1px solid ${stream.isActive ? '#f9731644' : '#22c55e44'}`,
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {stream.isActive ? '⏸️ स्ट्रीम रोकें (Stop)' : '▶️ फिर से चालू करें (Resume)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStream(stream.id, stream.title)}
                      style={{
                        backgroundColor: '#ef444422',
                        color: '#ef4444',
                        border: '1px solid #ef444444',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ हटाएं
                    </button>
                  </div>

                  {/* Bullet updates section */}
                  <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed #334155' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      इस स्ट्रीम के लिए ब्रेकिंग बुलेट जोड़ें:
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="नया लाइव अपडेट..."
                        value={postTexts[stream.id] || ''}
                        onChange={(e) => setPostTexts(prev => ({ ...prev, [stream.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handlePostBullet(stream.id); }}
                        style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => handlePostBullet(stream.id)}
                        style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '0 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        भेजें
                      </button>
                    </div>

                    {stream.updates && stream.updates.length > 0 && (
                      <div style={{ marginTop: '10px', maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {[...stream.updates].slice(-3).reverse().map(u => (
                          <div key={u.id} style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
                            <span style={{ color: '#ea580c', fontWeight: 700 }}>[{u.time}]</span> {u.update}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}