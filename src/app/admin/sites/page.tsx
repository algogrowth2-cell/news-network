'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

interface SiteData {
  id: string;
  name: string;
  slug: string;
  domain: string;
  subdomain?: string;
  language: string;
  region: string;
  description?: string;
  active: boolean;
  primaryColor: string;
  secondaryColor: string;
  headerBg?: string;
  fontFamily?: string;
  navStyle?: string;
  logoUrl?: string;
  faviconUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    whatsapp?: string;
  };
  seo?: {
    metaTitle?: string;
    ogImage?: string;
    metaDescription?: string;
  };
}

export default function SitesPage() {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'edit'>('list');
  const [saving, setSaving] = useState(false);
  const [showNewBox, setShowNewBox] = useState(false);

  // New Site Quick Fields (Screenshot Exact Match)
  const [newSiteName, setNewSiteName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newLanguage, setNewLanguage] = useState('hi');
  const [newDescription, setNewDescription] = useState('');

  // Edit Site Form State
  const [formData, setFormData] = useState<SiteData>({
    id: 'the-local-leader',
    name: 'The Local Leader',
    slug: 'the-local-leader',
    domain: 'thelocalleader.in',
    subdomain: '',
    language: 'Hindi',
    region: 'India',
    description: 'Hindi News Portal',
    active: true,
    primaryColor: '#E53E3E',
    secondaryColor: '#FF8C00',
    headerBg: '#1a1a2e',
    fontFamily: 'Noto Sans Devanagari',
    navStyle: 'Mega Menu',
    logoUrl: '/logo.png',
    faviconUrl: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      whatsapp: ''
    },
    seo: {
      metaTitle: '',
      ogImage: '',
      metaDescription: ''
    }
  });

  const fetchSites = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'sites'));
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SiteData));
        setSites(list);
      } else {
        const defaultSite: SiteData = {
          id: 'the-local-leader',
          name: 'The Local Leader',
          slug: 'the-local-leader',
          domain: 'thelocalleader.in',
          language: 'Hindi',
          region: 'India',
          description: 'Hindi News Portal',
          primaryColor: '#E53E3E',
          secondaryColor: '#FF8C00',
          headerBg: '#1a1a2e',
          fontFamily: 'Noto Sans Devanagari',
          navStyle: 'Mega Menu',
          logoUrl: '/logo.png',
          active: true,
          socialLinks: {},
          seo: {}
        };
        setSites([defaultSite]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleNameChange = (val: string) => {
    setNewSiteName(val);
    setNewSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
  };

  const handleCreateNewSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim()) return alert('कृपया Site Name दर्ज करें');

    const cleanSlug = newSlug.trim() || newSiteName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setSaving(true);

    try {
      const newSitePayload: SiteData = {
        id: cleanSlug,
        name: newSiteName.trim(),
        slug: cleanSlug,
        domain: newDomain.trim() || `${cleanSlug}.thelocalleader.in`,
        region: newRegion.trim() || 'India',
        language: newLanguage.trim() || 'hi',
        description: newDescription.trim() || 'News Portal Network Site',
        active: true,
        primaryColor: '#ea580c',
        secondaryColor: '#f97316',
        headerBg: '#ffffff',
        fontFamily: 'Noto Sans Devanagari',
        navStyle: 'Mega Menu',
        logoUrl: '/logo.png',
        faviconUrl: '',
        socialLinks: {},
        seo: {
          metaTitle: newSiteName.trim(),
          metaDescription: newDescription.trim()
        }
      };

      await setDoc(doc(db, 'sites', cleanSlug), {
        ...newSitePayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert(`'${newSiteName}' साइट सफलतापूर्वक बना दी गई है! अब आप इसके लिए आर्टिकल्स पब्लिश कर सकते हैं।`);
      setNewSiteName('');
      setNewSlug('');
      setNewDomain('');
      setNewRegion('');
      setNewDescription('');
      setShowNewBox(false);
      fetchSites();
    } catch (err: any) {
      alert('Error creating site: ' + err.message);
    }
    setSaving(false);
  };

  const handleEditClick = (s: SiteData) => {
    setFormData({
      ...s,
      slug: s.slug || s.id,
      headerBg: s.headerBg || '#1a1a2e',
      fontFamily: s.fontFamily || 'Noto Sans Devanagari',
      navStyle: s.navStyle || 'Mega Menu',
      logoUrl: s.logoUrl || '/logo.png',
      socialLinks: s.socialLinks || {},
      seo: s.seo || {}
    });
    setActiveTab('edit');
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const siteId = formData.slug || formData.id || 'the-local-leader';
      await setDoc(doc(db, 'sites', siteId), {
        ...formData,
        id: siteId,
        updatedAt: serverTimestamp()
      }, { merge: true });

      alert('Site settings updated successfully!');
      setActiveTab('list');
      fetchSites();
    } catch (err: any) {
      alert('Error updating site: ' + err.message);
    }
    setSaving(false);
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#0f172a'
  };

  return (
    <div style={{ color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          {activeTab === 'list' ? (
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#fff' }}>Sites ({sites.length})</h1>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setActiveTab('list')} 
                style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}
              >
                ←
              </button>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#fff' }}>Edit Site</h1>
            </div>
          )}
        </div>

        {activeTab === 'list' ? (
          <button 
            onClick={() => setShowNewBox(!showNewBox)} 
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            + New Site
          </button>
        ) : (
          <button
            onClick={() => handleSaveEdit()}
            disabled={saving}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer'
            }}
          >
            💾 {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {/* NEW SITE FORM BOX (EXACT MATCHING SCREENSHOT image_011607.png) */}
      {activeTab === 'list' && showNewBox && (
        <form 
          onSubmit={handleCreateNewSite}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #cbd5e1',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <input 
              type="text" 
              required
              placeholder="Site Name" 
              value={newSiteName} 
              onChange={e => handleNameChange(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '14px', outline: 'none', color: '#1e293b' }}
            />
            <input 
              type="text" 
              required
              placeholder="Slug" 
              value={newSlug} 
              onChange={e => setNewSlug(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '14px', outline: 'none', color: '#1e293b' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Domain (e.g. news.example.com)" 
              value={newDomain} 
              onChange={e => setNewDomain(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '14px', outline: 'none', color: '#1e293b' }}
            />
            <input 
              type="text" 
              placeholder="Region" 
              value={newRegion} 
              onChange={e => setNewRegion(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '14px', outline: 'none', color: '#1e293b' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Language (e.g. hi, en)" 
              value={newLanguage} 
              onChange={e => setNewLanguage(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '14px', outline: 'none', color: '#1e293b' }}
            />
            <input 
              type="text" 
              placeholder="Description" 
              value={newDescription} 
              onChange={e => setNewDescription(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '14px', outline: 'none', color: '#1e293b' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="submit" 
              disabled={saving}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {saving ? 'Creating...' : 'Create Site'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowNewBox(false)}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #94a3b8',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* SITES LIST CARDS */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {sites.map((site) => (
            <div key={site.id} className={styles.formCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0b1120', border: '1px solid #1e293b' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{site.name}</span>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    background: site.active ? '#065f46' : '#991b1b', 
                    color: site.active ? '#34d399' : '#fca5a5',
                    fontWeight: 700
                  }}>
                    {site.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#38bdf8', marginBottom: '8px' }}>{site.domain}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Language: {site.language} | Region: {site.region || 'India'}</div>

                {/* Color Palette Preview */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Theme:</span>
                  <div style={{ width: '22px', height: '22px', borderRadius: '4px', background: site.primaryColor, border: '1px solid #fff' }} title="Primary" />
                  <div style={{ width: '22px', height: '22px', borderRadius: '4px', background: site.secondaryColor, border: '1px solid #fff' }} title="Secondary" />
                </div>
              </div>

              <button 
                onClick={() => handleEditClick(site)} 
                style={{ marginTop: '16px', background: '#1e293b', color: '#38bdf8', border: '1px solid #38bdf8', borderRadius: '6px', padding: '8px', width: '100%', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Edit Site & Theme →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* EDIT SITE FORM */}
      {activeTab === 'edit' && (
        <div>
          {/* Row 1 Grid: Basic Information & Theme */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
            
            {/* Box 1: Basic Information */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '18px' }}>Basic Information</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input style={inputStyle} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Slug</label>
                    <input style={inputStyle} value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Domain</label>
                    <input style={inputStyle} value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Subdomain</label>
                    <input style={inputStyle} value={formData.subdomain || ''} onChange={e => setFormData({ ...formData, subdomain: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Language</label>
                    <select style={{ ...inputStyle, background: '#fff' }} value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })}>
                      <option value="Hindi">Hindi</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Region</label>
                    <input style={inputStyle} value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input 
                    type="checkbox" 
                    id="activeSiteToggle" 
                    checked={formData.active} 
                    onChange={e => setFormData({ ...formData, active: e.target.checked })} 
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                  />
                  <label htmlFor="activeSiteToggle" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>Active</label>
                </div>
              </div>
            </div>

            {/* Box 2: Theme */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '18px' }}>Theme</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Primary Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="color" value={formData.primaryColor} onChange={e => setFormData({ ...formData, primaryColor: e.target.value })} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
                      <input style={inputStyle} value={formData.primaryColor} onChange={e => setFormData({ ...formData, primaryColor: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Secondary Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="color" value={formData.secondaryColor} onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
                      <input style={inputStyle} value={formData.secondaryColor} onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Header Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="color" value={formData.headerBg || '#1a1a2e'} onChange={e => setFormData({ ...formData, headerBg: e.target.value })} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
                    <input style={inputStyle} value={formData.headerBg || '#1a1a2e'} onChange={e => setFormData({ ...formData, headerBg: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Font Family</label>
                  <select style={{ ...inputStyle, background: '#fff' }} value={formData.fontFamily || 'Noto Sans Devanagari'} onChange={e => setFormData({ ...formData, fontFamily: e.target.value })}>
                    <option value="Noto Sans Devanagari">Noto Sans Devanagari</option>
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Nav Style</label>
                  <select style={{ ...inputStyle, background: '#fff' }} value={formData.navStyle || 'Mega Menu'} onChange={e => setFormData({ ...formData, navStyle: e.target.value })}>
                    <option value="Mega Menu">Mega Menu</option>
                    <option value="Simple Navbar">Simple Navbar</option>
                  </select>
                </div>

                {/* Live Theme Preview Box */}
                <div style={{ background: '#0b1120', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</span>
                  <div style={{ background: formData.headerBg || '#1a1a2e', padding: '10px 14px', borderRadius: '6px', color: '#fff', fontWeight: 800, marginTop: '8px' }}>
                    {formData.name}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <span style={{ background: formData.primaryColor, color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>Primary</span>
                    <span style={{ background: formData.secondaryColor, color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>Secondary</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Row 2 Grid: Branding & Social Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
            
            {/* Box 3: Branding */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '18px' }}>Branding</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Logo</label>
                  <div style={{ display: 'inline-block', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', background: '#f8fafc', marginBottom: '8px' }}>
                    <img src={formData.logoUrl || '/logo.png'} alt="Site Logo" style={{ height: '56px', width: 'auto', objectFit: 'contain', display: 'block' }} />
                  </div>
                  <label style={{ ...labelStyle, fontSize: '12px', color: '#64748b' }}>Or paste image URL:</label>
                  <input style={inputStyle} value={formData.logoUrl || ''} onChange={e => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="https://... or /logo.png" />
                </div>

                <div>
                  <label style={labelStyle}>Favicon URL</label>
                  <input style={inputStyle} value={formData.faviconUrl || ''} onChange={e => setFormData({ ...formData, faviconUrl: e.target.value })} placeholder="https://... or /favicon.ico" />
                </div>
              </div>
            </div>

            {/* Box 4: Social Links */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '18px' }}>Social Links</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Facebook</label>
                  <input 
                    style={inputStyle} 
                    placeholder="facebook URL" 
                    value={formData.socialLinks?.facebook || ''} 
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, facebook: e.target.value } })} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Twitter</label>
                  <input 
                    style={inputStyle} 
                    placeholder="twitter URL" 
                    value={formData.socialLinks?.twitter || ''} 
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Instagram</label>
                  <input 
                    style={inputStyle} 
                    placeholder="instagram URL" 
                    value={formData.socialLinks?.instagram || ''} 
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Youtube</label>
                  <input 
                    style={inputStyle} 
                    placeholder="youtube URL" 
                    value={formData.socialLinks?.youtube || ''} 
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Whatsapp</label>
                  <input 
                    style={inputStyle} 
                    placeholder="whatsapp URL" 
                    value={formData.socialLinks?.whatsapp || ''} 
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, whatsapp: e.target.value } })} 
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Row 3: SEO Defaults */}
          <div style={{ ...cardStyle, marginBottom: '40px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '18px' }}>SEO Defaults</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Default Meta Title</label>
                  <input 
                    style={inputStyle} 
                    value={formData.seo?.metaTitle || ''} 
                    onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value } })} 
                    placeholder="द लोकल लीडर | ताज़ा और निष्पक्ष समाचार" 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Default OG Image</label>
                  <input 
                    style={inputStyle} 
                    value={formData.seo?.ogImage || ''} 
                    onChange={e => setFormData({ ...formData, seo: { ...formData.seo, ogImage: e.target.value } })} 
                    placeholder="https://..." 
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Default Meta Description</label>
                <textarea 
                  rows={3} 
                  style={{ ...inputStyle, resize: 'vertical' }} 
                  value={formData.seo?.metaDescription || ''} 
                  onChange={e => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value } })} 
                  placeholder="The Local Leader news portal description for search engines..." 
                />
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}