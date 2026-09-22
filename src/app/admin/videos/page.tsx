'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

interface NewsVideo {
  id: string;
  title: string;
  category: string;
  siteId: string;
  cityName: string;
  videoType: 'youtube' | 'direct' | 'shorts';
  videoUrl: string;
  thumbnailUrl: string;
  duration?: string;
  views?: number;
  status: 'published' | 'draft';
  createdAt?: any;
}

const NETWORK_WEBSITES = [
  { name: 'द लोकल लीडर', slug: 'the-local-leader' },
  { name: 'बाज़ार कारोबार', slug: 'bazar-karobar' },
  { name: 'गोल्डन पर्ल क्रॉनिकल्स', slug: 'golden-pearl-chronicles' },
  { name: 'द प्रोव्यू टाइम्स', slug: 'state-express' },
  { name: 'देश की आवाज़', slug: 'desh-ki-aawaz' },
  { name: 'जन भारत न्यूज़', slug: 'jan-chetna-news' },
  { name: 'NEWS INFO 24', slug: 'city-bulletin' },
  { name: 'डिफेंस न्यूज़', slug: 'national-spotlight' }
];

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<NewsVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('राजनीति');
  const [siteId, setSiteId] = useState('the-local-leader');
  const [cityName, setCityName] = useState('भोपाल');
  const [videoType, setVideoType] = useState<'youtube' | 'direct' | 'shorts'>('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [duration, setDuration] = useState('02:30');

  // Preview State
  const [previewVideo, setPreviewVideo] = useState<NewsVideo | null>(null);

  // 1. Fetch Real-time News Videos
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'news_videos'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: NewsVideo[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      } as NewsVideo));

      setVideos(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. YouTube Auto-detection & ID extractor
  const isYouTubeUrl = (url: string) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('watch?v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }
      if (url.includes('youtube.com/shorts/')) {
        const id = url.split('youtube.com/shorts/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }
    } catch (e) {
      console.error(e);
    }
    return url;
  };

  // 3. Upload / Create Video Entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      alert('कृपया वीडियो का शीर्षक और वीडियो लिंक दर्ज करें।');
      return;
    }

    try {
      setSubmitting(true);

      let finalThumb = thumbnailUrl.trim();
      if (!finalThumb && isYouTubeUrl(videoUrl)) {
        let ytId = '';
        if (videoUrl.includes('watch?v=')) ytId = videoUrl.split('watch?v=')[1]?.split('&')[0];
        else if (videoUrl.includes('youtu.be/')) ytId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        else if (videoUrl.includes('shorts/')) ytId = videoUrl.split('shorts/')[1]?.split('?')[0];
        if (ytId) finalThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      }

      await addDoc(collection(db, 'news_videos'), {
        title: title.trim(),
        category,
        siteId,
        cityName: cityName.trim(),
        videoType: isYouTubeUrl(videoUrl) ? (videoUrl.includes('shorts') ? 'shorts' : 'youtube') : videoType,
        videoUrl: videoUrl.trim(),
        thumbnailUrl: finalThumb || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
        duration: duration.trim() || '02:00',
        views: 0,
        status: 'published',
        createdAt: serverTimestamp()
      });

      alert('न्यूज़ वीडियो सफलतापूर्वक लाइव पब्लिश हो गया है!');
      setTitle('');
      setVideoUrl('');
      setThumbnailUrl('');
      setShowModal(false);
      setSubmitting(false);
    } catch (err: any) {
      setSubmitting(false);
      alert('Upload error: ' + err.message);
    }
  };

  // 4. Delete Video
  const handleDelete = async (id: string, vidTitle: string) => {
    if (!confirm(`क्या आप "${vidTitle}" वीडियो को हटाना चाहते हैं?`)) return;
    try {
      await deleteDoc(doc(db, 'news_videos', id));
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    }
  };

  return (
    <div style={{ backgroundColor: '#070b14', minHeight: '100vh', padding: '28px', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
            न्यूज़ वीडियो एवं रील्स प्रबंधन ({videos.length})
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Upload & manage ground report videos, bulletin clips, and YouTube Shorts for Website & App
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#ea580c',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(234,88,12,0.3)'
          }}
        >
          + नया न्यूज़ वीडियो जोड़ें
        </button>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>वीडियो लोड हो रहे हैं...</div>
      ) : videos.length === 0 ? (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '70px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '36px' }}>📹</span>
          <h3 style={{ fontSize: '18px', color: '#ffffff', margin: '12px 0 6px 0' }}>कोई न्यूज़ वीडियो उपलब्ध नहीं है</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px' }}>वेबसाइट और ऐप पर वीडियो दिखाने के लिए ऊपर "+ नया न्यूज़ वीडियो जोड़ें" पर क्लिक करें।</p>
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: '#ea580c', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            + पहला वीडियो अपलोड करें
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {videos.map((vid) => (
            <div
              key={vid.id}
              style={{
                backgroundColor: '#0e1626',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Thumbnail Container */}
              <div 
                style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000', cursor: 'pointer' }}
                onClick={() => setPreviewVideo(vid)}
              >
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                {/* Play Button Overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(234,88,12,0.9)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '18px' }}>
                    ▶
                  </div>
                </div>

                {/* Duration Badge */}
                {vid.duration && (
                  <span style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {vid.duration}
                  </span>
                )}

                {/* Video Type Badge */}
                <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(15,23,42,0.85)', color: '#38bdf8', fontSize: '10.5px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                  {isYouTubeUrl(vid.videoUrl) ? 'YOUTUBE' : vid.videoType}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: '#ea580c', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    {vid.category} · {vid.cityName}
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                    {vid.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    पोर्टल: <span style={{ color: '#94a3b8' }}>{vid.siteId}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #162238' }}>
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                    ● Live on Web & App
                  </span>

                  <button
                    onClick={() => handleDelete(vid.id, vid.title)}
                    style={{ backgroundColor: 'transparent', border: 'none', color: '#f87171', fontSize: '12.5px', cursor: 'pointer', padding: '4px' }}
                  >
                    हटाएं (Delete)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add New News Video */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '26px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#ffffff', margin: '0 0 16px 0' }}>
              नया न्यूज़ वीडियो पब्लिश करें
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>वीडियो का मुख्य शीर्षक (Headline) *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. सीएम का बड़ा ऐलान: मेट्रो प्रोजेक्ट का हुआ शुभारंभ..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 12px', color: '#ffffff', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>वीडियो प्रकार (Format)</label>
                  <select
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value as any)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
                  >
                    <option value="youtube">YouTube Video Embed</option>
                    <option value="shorts">YouTube Shorts / Reel (Vertical)</option>
                    <option value="direct">Direct MP4 Video Link</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>पोर्टल चयन</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
                  >
                    {NETWORK_WEBSITES.map(w => (
                      <option key={w.slug} value={w.slug}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>श्रेणी (Category)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
                  >
                    <option value="राजनीति">राजनीति</option>
                    <option value="अपराध">अपराध (Crime)</option>
                    <option value="शहर हलचल">शहर हलचल</option>
                    <option value="व्यापार">व्यापार</option>
                    <option value="विशेष रिपोर्ट">विशेष रिपोर्ट</option>
                    <option value="खेल">खेल</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>शहर / ज़िला</label>
                  <input
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="उदा. भोपाल"
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>वीडियो लिंक (YouTube / Shorts / MP4 URL) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... या MP4 URL"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 12px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>थंबनेल इमेज URL (वैकल्पिक)</label>
                  <input
                    type="url"
                    placeholder="YouTube से स्वतः भी जनरेट हो जाएगा"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>वीडियो अवधि (Duration)</label>
                  <input
                    type="text"
                    placeholder="02:30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '9px 12px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: '#ea580c', border: 'none', color: '#ffffff', padding: '9px 22px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                >
                  {submitting ? 'पब्लिश हो रहा है...' : 'पब्लिश करें (Live on Web & App)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal with YouTube Auto-detection */}
      {previewVideo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '16px' }}>
          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px', width: '100%', maxWidth: '780px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <b style={{ color: '#fff', fontSize: '15px' }}>{previewVideo.title}</b>
              <button
                onClick={() => setPreviewVideo(null)}
                style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}
              >
                ✕ बंद करें
              </button>
            </div>

            <div style={{ width: '100%', aspectRatio: previewVideo.videoType === 'shorts' ? '9/16' : '16/9', maxHeight: '70vh', backgroundColor: '#000', margin: '0 auto', overflow: 'hidden', borderRadius: '8px' }}>
              {isYouTubeUrl(previewVideo.videoUrl) ? (
                <iframe
                  src={getEmbedUrl(previewVideo.videoUrl)}
                  title={previewVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <video src={previewVideo.videoUrl} controls autoPlay style={{ width: '100%', height: '100%' }} />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}