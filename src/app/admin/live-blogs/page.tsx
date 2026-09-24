'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

interface UpdateItem {
  id: string;
  time: string;
  update: string;
}

interface LiveBlogData {
  title: string;
  siteId: string;
  youtubeUrl: string;
  youtubeId: string;
  isActive: boolean;
  updates: UpdateItem[];
  updatedAt?: any;
}

const NETWORK_PORTALS = [
  { slug: 'all', name: 'Sabhi Portals (All Network)' },
  { slug: 'the-local-leader', name: 'The Local Leader' },
  { slug: 'bazar-karobar', name: 'Bazar Karobar' },
  { slug: 'golden-pearl-chronicles', name: 'Golden Pearl Chronicles' },
  { slug: 'state-express', name: 'The Proview Times' },
  { slug: 'desh-ki-aawaz', name: 'Desh Ki Aawaz' },
  { slug: 'jan-chetna-news', name: 'Jan Bharat News' },
  { slug: 'city-bulletin', name: 'NEWS INFO 24' },
  { slug: 'national-spotlight', name: 'Defense News' }
];

export default function LiveBlogsPage() {
  const [selectedSite, setSelectedSite] = useState('the-local-leader');
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [postText, setPostText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const extractYouTubeId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.trim();
  };

  useEffect(() => {
    setLoading(true);
    const docRef = doc(db, 'live_blogs', selectedSite);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as LiveBlogData;
        setTitle(data.title || '');
        setYoutubeUrl(data.youtubeUrl || '');
        setIsActive(!!data.isActive);
        setUpdates(data.updates || []);
      } else {
        setTitle('');
        setYoutubeUrl('');
        setIsActive(false);
        setUpdates([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [selectedSite]);

  const handleSaveLiveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeUrl.trim()) {
      alert('Kripya Live Stream ka Title aur YouTube URL enter karein!');
      return;
    }

    const yId = extractYouTubeId(youtubeUrl);
    if (!yId) {
      alert('Sahi YouTube URL ya Video ID enter karein!');
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, 'live_blogs', selectedSite);
      await setDoc(docRef, {
        title: title.trim(),
        siteId: selectedSite,
        youtubeUrl: youtubeUrl.trim(),
        youtubeId: yId,
        isActive: true,
        updates: updates || [],
        updatedAt: serverTimestamp()
      }, { merge: true });

      setIsActive(true);
      alert(`Live Stream ${selectedSite} par successfully LIVE ho chuka hai!`);
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    }
    setSaving(false);
  };

  const handleStopLiveStream = async () => {
    if (!window.confirm('Kya aap is live stream ko band karna chahte hain?')) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'live_blogs', selectedSite);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      setIsActive(false);
      alert('Live stream band kar diya gaya hai!');
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    }
    setSaving(false);
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;

    const newUpdate: UpdateItem = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      update: postText.trim()
    };

    try {
      const docRef = doc(db, 'live_blogs', selectedSite);
      await updateDoc(docRef, {
        updates: arrayUnion(newUpdate),
        updatedAt: serverTimestamp()
      });
      setPostText('');
    } catch (err: any) {
      console.error(err);
      alert('Error posting update: ' + err.message);
    }
  };

  const currentEmbedId = extractYouTubeId(youtubeUrl);

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>YouTube Live Stream & Live Blog</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            YouTube channel ka live link yahan dalein, website par news feed, video aur live sections me video stream chalegi.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Target Portal:</span>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Left Form: YouTube Stream Settings */}
        <div className={styles.formCard} style={{ backgroundColor: '#1e242b', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Live Setup</h2>
            {isActive ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ef444422', color: '#ef4444', padding: '4px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 800 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} /> LIVE ACTIVE
              </span>
            ) : (
              <span style={{ backgroundColor: '#334155', color: '#94a3b8', padding: '4px 10px', borderRadius: '14px', fontSize: '11px' }}>
                OFFLINE
              </span>
            )}
          </div>

          <form onSubmit={handleSaveLiveStream} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                Live Stream Title (Heading) *
              </label>
              <input
                type="text"
                placeholder="Ex: ग्राउंड रिपोर्ट: आज की बड़ी चुनावी हलचल लाइव"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13.5px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                YouTube Live / Video Link *
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=XXXX ya https://youtu.be/live/XXXX"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13.5px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: '#ea580c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {saving ? 'Saving...' : '🚀 Website Par Live Karein'}
              </button>

              {isActive && (
                <button
                  type="button"
                  onClick={handleStopLiveStream}
                  disabled={saving}
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '11px 16px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Live Stop Karein
                </button>
              )}
            </div>
          </form>

          {currentEmbedId && (
            <div style={{ marginTop: '18px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Video Preview:</span>
              <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${currentEmbedId}`}
                  title="YouTube Live Preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Realtime Live Updates */}
        <div className={styles.formCard} style={{ backgroundColor: '#1e242b', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
            Live Text Updates (Breaking Bullets)
          </h2>

          <form onSubmit={handlePostUpdate} style={{ marginBottom: '18px' }}>
            <textarea
              rows={3}
              placeholder="Live breaking bullet ya taaza update yahan likhein..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical' }}
            />
            <button
              type="submit"
              disabled={!isActive}
              style={{
                marginTop: '8px',
                backgroundColor: isActive ? '#38bdf8' : '#475569',
                color: isActive ? '#0f172a' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: isActive ? 'pointer' : 'not-allowed'
              }}
            >
              + Quick Update Post Karein
            </button>
            {!isActive && (
              <span style={{ fontSize: '11px', color: '#f87171', marginLeft: '10px' }}>
                (Pehle stream ko live karein)
              </span>
            )}
          </form>

          <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {updates.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '20px 0' }}>
                Abhi koi update post nahi kiya gaya hai
              </div>
            ) : (
              [...updates].reverse().map((item) => (
                <div key={item.id} style={{ borderLeft: '3px solid #ea580c', paddingLeft: '12px', backgroundColor: '#0f172a55', padding: '8px 12px', borderRadius: '0 8px 8px 0' }}>
                  <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: 700 }}>⏱ {item.time}</span>
                  <p style={{ fontSize: '13px', margin: '4px 0 0', color: '#f1f5f9' }}>{item.update}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}