'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SiteItem {
  id: string;
  name: string;
  language?: string;
}

export default function NewArticlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');

  // Form States
  const [title, setTitle] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Draft');
  const [selectedSite, setSelectedSite] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Default network sites fallback
  const defaultSites: SiteItem[] = [
    { id: 'bazar-karobar', name: 'Bazar Karobar (Hindi)' },
    { id: 'desh-ki-awaz', name: 'Desh Ki awaz (Hindi)' },
    { id: 'jan-bharat', name: 'Jan Bharat News (Hindi)' },
    { id: 'national-defence', name: 'National Defence Network (English)' },
    { id: 'newsinfo24', name: 'Newsinfo24 (English)' },
    { id: 'the-local-leader', name: 'The Local Leader (Hindi)' },
    { id: 'proview-times', name: 'The Proview Time (Hindi)' }
  ];

  const categories = [
    'National', 'Business', 'Politics', 'Sports', 'Technology', 
    'Entertainment', 'Health', 'Crime', 'Lifestyle', 'Agriculture'
  ];

  const availableTags = [
    'Bollywood', 'Breaking News', 'Budget', 'COVID-19', 'Cricket', 'Elections', 'IPL', 'Weather'
  ];

  useEffect(() => {
    async function loadSites() {
      try {
        const snap = await getDocs(collection(db, 'sites'));
        if (!snap.empty) {
          const list = snap.docs.map(doc => ({
            id: doc.id,
            name: `${doc.data().name} (${doc.data().language === 'en' ? 'English' : 'Hindi'})`
          }));
          setSites(list);
        } else {
          setSites(defaultSites);
        }
      } catch (err) {
        console.error('Sites loading error:', err);
        setSites(defaultSites);
      }
    }
    loadSites();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async (publishStatus: string) => {
    if (!title.trim()) {
      alert('Please enter Article Title');
      return;
    }
    if (!selectedSite) {
      alert('Please select a website from "Publish to Site"');
      return;
    }
    if (!category) {
      alert('Please select a Category');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'articles'), {
        title,
        titleHi,
        slug: slug || Date.now().toString(),
        summary,
        content,
        status: publishStatus,
        siteId: selectedSite,
        category,
        image: thumbnail || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop',
        tags: selectedTags,
        views: 0,
        createdAt: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp()
      });

      alert(`Article successfully saved as ${publishStatus} for ${selectedSite}!`);
      router.push('/admin/articles');
    } catch (e: any) {
      alert('Error saving article: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ color: '#fff', maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin/articles" style={{ color: '#fff', textDecoration: 'none', fontSize: '18px', fontWeight: 700 }}>
            ←
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>New Article</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            onClick={() => handleSave('Draft')} 
            disabled={loading}
            style={{ padding: '8px 16px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            💾 Save Draft
          </button>
          <button 
            type="button" 
            onClick={() => handleSave('Published')} 
            disabled={loading}
            style={{ padding: '8px 18px', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
          >
            👁️ Publish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #1e293b', marginBottom: '20px', fontSize: '13.5px' }}>
        <button 
          onClick={() => setActiveTab('content')} 
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'content' ? '2px solid #2563eb' : 'none', color: activeTab === 'content' ? '#38bdf8' : '#94a3b8', padding: '8px 4px', cursor: 'pointer' }}
        >
          Content
        </button>
        <button 
          onClick={() => setActiveTab('seo')} 
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'seo' ? '2px solid #2563eb' : 'none', color: activeTab === 'seo' ? '#38bdf8' : '#94a3b8', padding: '8px 4px', cursor: 'pointer' }}
        >
          Seo
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'settings' ? '2px solid #2563eb' : 'none', color: activeTab === 'settings' ? '#38bdf8' : '#94a3b8', padding: '8px 4px', cursor: 'pointer' }}
        >
          Settings
        </button>
      </div>

      {/* 2-Column Responsive Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 340px', gap: '24px' }}>
        
        {/* Left Column: Form Details & Rich Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Title *</label>
              <input 
                type="text" 
                placeholder="Enter article title..." 
                value={title} 
                onChange={e => handleTitleChange(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Title (Hindi)</label>
              <input 
                type="text" 
                placeholder="हिंदी शीर्षक..." 
                value={titleHi} 
                onChange={e => setTitleHi(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Slug</label>
              <input 
                type="text" 
                placeholder="slug-url-path" 
                value={slug} 
                onChange={e => setSlug(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>Summary</label>
              <textarea 
                rows={3} 
                placeholder="Brief summary..." 
                value={summary} 
                onChange={e => setSummary(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical' }} 
              />
            </div>
          </div>

          {/* Rich Content Editor */}
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px' }}>Content *</label>
            
            {/* Editor Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', background: '#020617', border: '1px solid #334155', borderRadius: '6px 6px 0 0', borderBottom: 'none' }}>
              {['H1', 'H2', 'H3', '¶', 'B', 'I', 'U', 'S', '<>', '≡', '≣', '•', '1.', '❝', '—', '🔗', '🖼️', '▶'].map((tool, idx) => (
                <button key={idx} type="button" style={{ background: '#1e293b', border: 'none', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  {tool}
                </button>
              ))}
            </div>

            <textarea 
              rows={12} 
              placeholder="Start writing your article..." 
              value={content} 
              onChange={e => setContent(e.target.value)}
              style={{ width: '100%', padding: '14px', background: '#020617', border: '1px solid #334155', borderRadius: '0 0 6px 6px', color: '#fff', fontSize: '14px', outline: 'none', lineHeight: '1.6', resize: 'vertical' }} 
            />
          </div>
        </div>

        {/* Right Sidebar: Multi-Site Routing & Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Status Box */}
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Status</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13.5px', outline: 'none' }}
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>

          {/* Publish to Site Box */}
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Publish to Site *</label>
            <select 
              value={selectedSite} 
              onChange={e => setSelectedSite(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13.5px', outline: 'none' }}
            >
              <option value="">Select site</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Category Box */}
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>Category *</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13.5px', outline: 'none' }}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Thumbnail Box */}
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Thumbnail</label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Optional</span>
            </div>
            
            <div style={{ border: '1px dashed #334155', borderRadius: '6px', padding: '24px', textAlign: 'center', marginBottom: '12px', cursor: 'pointer' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>📤</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Click to upload</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>PNG, JPG, WebP (max 10MB)</div>
            </div>

            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>Or paste image URL:</label>
            <input 
              type="text" 
              placeholder="https://example.com/image.jpg" 
              value={thumbnail} 
              onChange={e => setThumbnail(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: '#020617', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px', outline: 'none' }}
            />
          </div>

          {/* Tags Box */}
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px' }}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {availableTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #2563eb' : '1px solid #334155',
                      background: isSelected ? '#1e3a8a' : '#0b1120',
                      color: isSelected ? '#60a5fa' : '#94a3b8'
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}