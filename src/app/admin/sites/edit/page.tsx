'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Basic Information
  const [name, setName] = useState('The Local Leader');
  const [slug, setSlug] = useState('the-local-leader');
  const [domain, setDomain] = useState('thelocalleader.in');
  const [subdomain, setSubdomain] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [region, setRegion] = useState('India');
  const [description, setDescription] = useState('Hindi News Portal');
  const [active, setActive] = useState(true);

  // 2. Theme
  const [primaryColor, setPrimaryColor] = useState('#E53E3E');
  const [secondaryColor, setSecondaryColor] = useState('#FF8C00');
  const [headerBg, setHeaderBg] = useState('#1a1a2e');
  const [fontFamily, setFontFamily] = useState('Noto Sans Devanagari');
  const [navStyle, setNavStyle] = useState('Mega Menu');

  // 3. Branding
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [faviconUrl, setFaviconUrl] = useState('');

  // 4. Social Links
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // 5. SEO Defaults
  const [metaTitle, setMetaTitle] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  useEffect(() => {
    async function loadSiteConfig() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'sites', 'the-local-leader'));
        if (snap.exists()) {
          const d = snap.data();
          setName(d.name ?? 'The Local Leader');
          setSlug(d.slug ?? 'the-local-leader');
          setDomain(d.domain ?? 'thelocalleader.in');
          setSubdomain(d.subdomain ?? '');
          setLanguage(d.language ?? 'Hindi');
          setRegion(d.region ?? 'India');
          setDescription(d.description ?? 'Hindi News Portal');
          setActive(d.active !== undefined ? d.active : true);

          setPrimaryColor(d.primaryColor ?? '#ea580c');
          setSecondaryColor(d.secondaryColor ?? '#FF8C00');
          setHeaderBg(d.headerBg ?? '#1a1a2e');
          setFontFamily(d.fontFamily ?? 'Noto Sans Devanagari');
          setNavStyle(d.navStyle ?? 'Mega Menu');

          setLogoUrl(d.logoUrl ?? '/logo.png');
          setFaviconUrl(d.faviconUrl ?? '');

          if (d.socialLinks) {
            setFacebook(d.socialLinks.facebook ?? '');
            setTwitter(d.socialLinks.twitter ?? '');
            setInstagram(d.socialLinks.instagram ?? '');
            setYoutube(d.socialLinks.youtube ?? '');
            setWhatsapp(d.socialLinks.whatsapp ?? '');
          }

          if (d.seo) {
            setMetaTitle(d.seo.metaTitle ?? '');
            setOgImage(d.seo.ogImage ?? '');
            setMetaDescription(d.seo.metaDescription ?? '');
          }
        }
      } catch (err) {
        console.error('Failed to load site config:', err);
      }
      setLoading(false);
    }

    loadSiteConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'sites', 'the-local-leader'), {
        name,
        slug,
        domain,
        subdomain,
        language,
        region,
        description,
        active,
        primaryColor,
        secondaryColor,
        headerBg,
        fontFamily,
        navStyle,
        logoUrl,
        faviconUrl,
        socialLinks: {
          facebook,
          twitter,
          instagram,
          youtube,
          whatsapp
        },
        seo: {
          metaTitle,
          ogImage,
          metaDescription
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      alert('Site settings updated successfully! Website updated in real-time.');
    } catch (err: any) {
      alert('Error updating site: ' + err.message);
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ color: '#fff', padding: '40px' }}>Loading site configuration...</div>;
  }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px' }}>
            ←
          </button>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#fff' }}>Edit Site</h1>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontWeight: 700,
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          💾 {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Main Grid Setup Matching Screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* Box 1: Basic Information */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '18px' }}>Basic Information</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Slug</label>
                <input style={inputStyle} value={slug} onChange={e => setSlug(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Domain</label>
                <input style={inputStyle} value={domain} onChange={e => setDomain(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Subdomain</label>
                <input style={inputStyle} value={subdomain} onChange={e => setSubdomain(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Language</label>
                <select style={{ ...inputStyle, background: '#fff' }} value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Region</label>
                <input style={inputStyle} value={region} onChange={e => setRegion(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input type="checkbox" id="activeSite" checked={active} onChange={e => setActive(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <label htmlFor="activeSite" style={{ fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>Active</label>
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
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
                  <input style={inputStyle} value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Secondary Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
                  <input style={inputStyle} value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Header Background</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={headerBg} onChange={e => setHeaderBg(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }} />
                <input style={inputStyle} value={headerBg} onChange={e => setHeaderBg(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Font Family</label>
              <select style={{ ...inputStyle, background: '#fff' }} value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                <option value="Noto Sans Devanagari">Noto Sans Devanagari</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Nav Style</label>
              <select style={{ ...inputStyle, background: '#fff' }} value={navStyle} onChange={e => setNavStyle(e.target.value)}>
                <option value="Mega Menu">Mega Menu</option>
                <option value="Simple Navbar">Simple Navbar</option>
              </select>
            </div>

            {/* Live Theme Preview Box */}
            <div style={{ background: '#0b1120', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</span>
              <div style={{ background: headerBg, padding: '10px 14px', borderRadius: '6px', color: '#fff', fontWeight: 800, marginTop: '8px' }}>
                {name}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <span style={{ background: primaryColor, color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>Primary</span>
                <span style={{ background: secondaryColor, color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>Secondary</span>
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
                <img src={logoUrl || '/logo.png'} alt="Site Logo" style={{ height: '56px', width: 'auto', objectFit: 'contain', display: 'block' }} />
              </div>
              <label style={{ ...labelStyle, fontSize: '12px', color: '#64748b' }}>Or paste image URL:</label>
              <input style={inputStyle} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://... or /logo.png" />
            </div>

            <div>
              <label style={labelStyle}>Favicon URL</label>
              <input style={inputStyle} value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} placeholder="https://... or /favicon.ico" />
            </div>
          </div>
        </div>

        {/* Box 4: Social Links */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '18px' }}>Social Links</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Facebook</label>
              <input style={inputStyle} placeholder="facebook URL" value={facebook} onChange={e => setFacebook(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Twitter</label>
              <input style={inputStyle} placeholder="twitter URL" value={twitter} onChange={e => setTwitter(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Instagram</label>
              <input style={inputStyle} placeholder="instagram URL" value={instagram} onChange={e => setInstagram(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Youtube</label>
              <input style={inputStyle} placeholder="youtube URL" value={youtube} onChange={e => setYoutube(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Whatsapp</label>
              <input style={inputStyle} placeholder="whatsapp URL" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
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
              <input style={inputStyle} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="द लोकल लीडर | ताज़ा और निष्पक्ष समाचार" />
            </div>
            <div>
              <label style={labelStyle}>Default OG Image</label>
              <input style={inputStyle} value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Default Meta Description</label>
            <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="The Local Leader news portal description for search engines..." />
          </div>
        </div>
      </div>

    </div>
  );
}