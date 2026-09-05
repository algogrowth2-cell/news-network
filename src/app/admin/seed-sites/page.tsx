'use client';
import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const NETWORK_SITES = [
  {
    slug: 'the-local-leader',
    name: 'द लोकल लीडर',
    domain: 'thelocalleader.in',
    tagline: '— जनता की आवाज़, सच्चाई के साथ —',
    primaryColor: '#ea580c',
    secondaryColor: '#1e242b',
    headerBg: '#ffffff',
    logoUrl: '/logos/the-local-leader.jpeg',
    language: 'Hindi',
    region: 'India'
  },
  {
    slug: 'bazar-karobar',
    name: 'बाजार कारोबार',
    domain: 'bazarkarobar.in',
    tagline: 'व्यापार की हर बात, आपके साथ',
    primaryColor: '#e85023',
    secondaryColor: '#2b2b2b',
    headerBg: '#ffffff',
    logoUrl: '/logos/bazar-karobar.jpeg',
    language: 'Hindi',
    region: 'India'
  },
  {
    slug: 'golden-pearl-chronicles',
    name: 'गोल्डन पर्ल कॉनिकल्स',
    domain: 'goldenpearlchronicles.in',
    tagline: 'आज की खबर, कल का इतिहास',
    primaryColor: '#b58128',
    secondaryColor: '#1a1a1a',
    headerBg: '#ffffff',
    logoUrl: '/logos/golden-pearl-chronicles.jpeg',
    language: 'Hindi',
    region: 'India'
  },
  {
    slug: 'the-provue-times',
    name: 'द प्रोव्यू टाइम्स',
    domain: 'theprovuetimes.in',
    tagline: 'पेशेवर नज़र, सच्ची खबर',
    primaryColor: '#c91c1d',
    secondaryColor: '#111827',
    headerBg: '#ffffff',
    logoUrl: '/logos/the-provue-times.jpeg',
    language: 'Hindi',
    region: 'India'
  },
  {
    slug: 'desh-ki-aawaz',
    name: 'देश की आवाज़',
    domain: 'deshkiaawaz.in',
    tagline: 'खबरों में सच, सोच में दुनिया',
    primaryColor: '#db0f14',
    secondaryColor: '#222222',
    headerBg: '#ffffff',
    logoUrl: '/logos/desh-ki-aawaz.jpeg',
    language: 'Hindi',
    region: 'India'
  },
  {
    slug: 'jan-bharat-news',
    name: 'जन भारत न्यूज़',
    domain: 'janbharatnews.in',
    tagline: 'भारत की आवाज़',
    primaryColor: '#1e3a8a',
    secondaryColor: '#ea580c',
    headerBg: '#ffffff',
    logoUrl: '/logos/jan-bharat-news.jpeg',
    language: 'Hindi',
    region: 'India'
  },
  {
    slug: 'news-info-24',
    name: 'NEWS INFO 24',
    domain: 'newsinfo24.in',
    tagline: 'Stay Informed, Stay Ahead',
    primaryColor: '#e11d48',
    secondaryColor: '#334155',
    headerBg: '#ffffff',
    logoUrl: '/logos/news-info-24.jpeg',
    language: 'Hindi',
    region: 'India'
  },
  {
    slug: 'ndn-defence',
    name: 'National Defence Network',
    domain: 'ndndefence.in',
    tagline: 'DEFENCE BEYOND HEADLINES',
    primaryColor: '#2f4f38',
    secondaryColor: '#8b1e1e',
    headerBg: '#ffffff',
    logoUrl: '/logos/ndn-defence.jpeg',
    language: 'Hindi',
    region: 'India'
  }
];

export default function SeedSitesPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const runSeed = async () => {
    setLoading(true);
    setStatus('Creating and initializing 8 sites...');
    try {
      for (const site of NETWORK_SITES) {
        await setDoc(doc(db, 'sites', site.slug), {
          id: site.slug,
          name: site.name,
          slug: site.slug,
          domain: site.domain,
          description: site.tagline,
          primaryColor: site.primaryColor,
          secondaryColor: site.secondaryColor,
          headerBg: site.headerBg,
          fontFamily: 'Noto Sans Devanagari',
          navStyle: 'Mega Menu',
          logoUrl: site.logoUrl,
          active: true,
          language: site.language,
          region: site.region,
          socialLinks: {
            facebook: '',
            twitter: '',
            instagram: '',
            youtube: '',
            whatsapp: ''
          },
          seo: {
            metaTitle: `${site.name} | ${site.tagline}`,
            metaDescription: `${site.name} official digital news portal`
          },
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      setStatus('Success! Saari 8 sites Firestore database me create ho chuki hain.');
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#fff', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto', background: '#1e293b', padding: '32px', borderRadius: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px 0' }}>Network Sites Initialization (JPEG)</h1>
        <p style={{ color: '#94a3b8', fontSize: '13.5px', lineHeight: '1.6' }}>
          Yeh action aapki saari 8 news portals ko unke authentic JPEG logos aur theme colors ke saath database me live kar dega.
        </p>

        <button 
          onClick={runSeed}
          disabled={loading}
          style={{ marginTop: '16px', background: '#ea580c', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
        >
          {loading ? 'Initializing Portals...' : '🚀 Initialize All 8 Portals'}
        </button>

        {status && (
          <div style={{ marginTop: '20px', padding: '14px', borderRadius: '8px', background: status.includes('Success') ? '#065f46' : '#7f1d1d', color: '#fff', fontSize: '13.5px' }}>
            {status}
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <Link href="/admin/sites" style={{ color: '#38bdf8', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to Admin Sites
          </Link>
        </div>
      </div>
    </div>
  );
}