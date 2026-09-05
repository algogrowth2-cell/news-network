'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Route change hone par mobile drawer automatically close ho jaye
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  // Screenshot (image_00ffbd.png) ke exact 4 categories aur 19 navigation links
  const navSections = [
    {
      heading: 'MAIN',
      items: [
        { label: 'Dashboard', icon: '⊞', href: '/admin' },
      ]
    },
    {
      heading: 'CONTENT',
      items: [
        { label: 'Articles', icon: '📄', href: '/admin/articles' },
        { label: 'Categories', icon: '📁', href: '/admin/categories' },
        { label: 'States & Cities', icon: '📍', href: '/admin/locations' },
        { label: 'Media Library', icon: '🖼️', href: '/admin/media' },
        { label: 'Web Stories', icon: '📱', href: '/admin/web-stories' },
        { label: 'Photo Galleries', icon: '📷', href: '/admin/galleries' },
        { label: 'E-Paper', icon: '📰', href: '/admin/epaper' },
        { label: 'Live Blogs', icon: '📡', href: '/admin/live-blogs' },
        { label: 'Rashifal', icon: '⭐', href: '/admin/rashifal' },
      ]
    },
    {
      heading: 'MODULES',
      items: [
        { label: 'Reporters', icon: '🪪', href: '/admin/reporters' },
        { label: 'Ads & Revenue', icon: '📢', href: '/admin/ads' },
        { label: 'Classifieds', icon: '📋', href: '/admin/classifieds' },
        { label: 'Shok Sandesh', icon: '🕊️', href: '/admin/obituaries' },
        { label: 'Membership', icon: '💳', href: '/admin/membership' },
        { label: 'Comments', icon: '💬', href: '/admin/comments' },
        { label: 'Analytics', icon: '📊', href: '/admin/analytics' },
      ]
    },
    {
      heading: 'SYSTEM',
      items: [
        { label: 'Sites', icon: '🌐', href: '/admin/sites' },
        { label: 'Page Builder', icon: '🧱', href: '/admin/page-builder' },
        { label: 'Users', icon: '👥', href: '/admin/users' },
        { label: 'Audit Log', icon: '🛡️', href: '/admin/audit-log' },
        { label: 'Settings', icon: '⚙️', href: '/admin/settings' },
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#090d16', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Mobile Responsive Injected Styling */}
      <style jsx global>{`
        .admin-sidebar-container {
          width: 240px;
          background: #0d1322;
          border-right: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          flex-shrink: 0;
          z-index: 1000;
          transition: transform 0.25s ease-in-out;
        }
        .admin-main-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow-x: hidden;
          background: #090d16;
        }
        .admin-mobile-header {
          display: none;
          background: #0d1322;
          border-bottom: 1px solid #1e293b;
          padding: 10px 16px;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 990;
        }
        .admin-sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(2px);
          z-index: 998;
        }

        /* Mobile Screens */
        @media (max-width: 900px) {
          .admin-sidebar-container {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: 10px 0 30px rgba(0,0,0,0.5);
          }
          .admin-sidebar-container.open {
            transform: translateX(0);
          }
          .admin-mobile-header {
            display: flex;
          }
          .admin-sidebar-overlay.active {
            display: block;
          }
        }
      `}</style>

      {/* Backdrop overlay for mobile drawer */}
      <div 
        className={`admin-sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* COMPLETE SIDEBAR (Exact match with Screenshot image_00ffbd.png) */}
      <aside className={`admin-sidebar-container ${mobileMenuOpen ? 'open' : ''}`}>
        
        {/* Brand & User Profile Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: '#2563eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '15px', fontWeight: 800 }}>
                ✎
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>NewsAdmin</span>
            </div>

            {/* Mobile close button */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer', padding: '0 4px', display: mobileMenuOpen ? 'block' : 'none' }}
            >
              ✕
            </button>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              admin@news.com
            </div>
            <span style={{ display: 'inline-block', fontSize: '9px', fontWeight: 800, background: '#1e3a8a', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              SUPER ADMIN
            </span>
          </div>
        </div>

        {/* Full Nav Sections List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', scrollbarWidth: 'thin' }}>
          {navSections.map((sec) => (
            <div key={sec.heading} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', letterSpacing: '0.8px', padding: '0 10px', marginBottom: '6px' }}>
                {sec.heading}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sec.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: isActive ? 700 : 500,
                        textDecoration: 'none',
                        color: isActive ? '#ffffff' : '#94a3b8',
                        background: isActive ? '#2563eb' : 'transparent',
                        transition: 'background 0.15s, color 0.15s'
                      }}
                    >
                      <span style={{ fontSize: '13px', width: '16px', textAlign: 'center' }}>{item.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Logout Button */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #1e293b', background: '#0a0f1d' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0'
            }}
          >
            <span>[→</span>
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="admin-main-wrapper">
        
        {/* Mobile Top Header with Hamburger Icon */}
        <header className="admin-mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ☰
            </button>
            <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#fff' }}>NewsAdmin</span>
          </div>

          <Link href="/" target="_blank" style={{ color: '#38bdf8', fontSize: '11.5px', textDecoration: 'none', fontWeight: 700 }}>
            Live Portal ↗
          </Link>
        </header>

        {/* Children Pages */}
        <main style={{ flex: 1, padding: 'clamp(14px, 2.5vw, 24px)', width: '100%', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>

    </div>
  );
}