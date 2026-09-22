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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // 1. STRICT AUTH CHECK: Bina ID-Password ke dashboard kabhi nahi khulega
  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsCheckingAuth(false);
      return;
    }

    const adminUser = localStorage.getItem('admin_user');
    const adminToken = localStorage.getItem('admin_token');

    if (!adminUser || !adminToken) {
      setIsAuthenticated(false);
      router.replace('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, [pathname, router]);

  // Route change hone par mobile drawer automatically close ho jaye
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsAuthenticated(false);
    router.replace('/admin/login');
  };

  // Login page — render without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Loading screen while auth check runs
  if (isCheckingAuth || !isAuthenticated) {
    return (
      <div className="na-auth-screen">
        <style jsx global>{`
          .na-auth-screen {
            min-height: 100vh;
            background: #06090f;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          }
          .na-auth-spinner {
            width: 36px;
            height: 36px;
            border: 2.5px solid rgba(99, 132, 255, 0.12);
            border-top-color: #6384ff;
            border-radius: 50%;
            animation: naSpinAuth 0.7s linear infinite;
            margin-bottom: 18px;
          }
          .na-auth-text {
            font-size: 12.5px;
            font-weight: 500;
            color: rgba(148, 163, 184, 0.7);
            letter-spacing: 0.6px;
          }
          @keyframes naSpinAuth {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div className="na-auth-spinner" />
        <span className="na-auth-text">Verifying credentials…</span>
      </div>
    );
  }

  // Navigation sections — unchanged
  const navSections = [
    {
      heading: 'Main',
      items: [
        { label: 'Dashboard', icon: '⊞', href: '/admin' },
      ]
    },
    {
      heading: 'Content',
      items: [
        { label: 'Articles', icon: '📄', href: '/admin/articles' },
        { label: 'Categories', icon: '📁', href: '/admin/categories' },
        { label: 'States & Cities', icon: '📍', href: '/admin/locations' },
        { label: 'Media Library', icon: '🖼️', href: '/admin/media' },
        { label: 'Web Stories', icon: '📱', href: '/admin/web-stories' },
        { label: 'News Videos', icon: '📹', href: '/admin/videos' },
        { label: 'Photo Galleries', icon: '📷', href: '/admin/galleries' },
        { label: 'E-Paper', icon: '📰', href: '/admin/epaper' },
        { label: 'Live Blogs', icon: '📡', href: '/admin/live-blogs' },
        { label: 'Rashifal', icon: '⭐', href: '/admin/rashifal' },
      ]
    },
    {
      heading: 'Modules',
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
      heading: 'System',
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
    <div className="na-shell">
      <style jsx global>{`
        /* ───────────── RESET & BASE ───────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .na-shell {
          display: flex;
          min-height: 100vh;
          background: #070a11;
          color: #e2e8f0;
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ───────────── SIDEBAR ───────────── */
        .na-sidebar {
          width: 252px;
          background: linear-gradient(180deg, #0c1020 0%, #080c18 100%);
          border-right: 1px solid rgba(148, 163, 184, 0.06);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          flex-shrink: 0;
          z-index: 1000;
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ───────────── SIDEBAR BRAND HEADER ───────────── */
        .na-brand {
          padding: 20px 18px 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.06);
        }

        .na-brand-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .na-brand-logo-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .na-brand-icon {
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #4f6ef7 0%, #6c3bdb 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 2px 12px rgba(79, 110, 247, 0.25);
        }

        .na-brand-name {
          font-size: 15.5px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.2px;
        }

        .na-brand-close {
          background: none;
          border: none;
          color: rgba(148, 163, 184, 0.5);
          font-size: 17px;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          line-height: 1;
          transition: color 0.15s, background 0.15s;
          display: none;
        }
        .na-brand-close:hover {
          color: #e2e8f0;
          background: rgba(148, 163, 184, 0.08);
        }
        .na-sidebar.open .na-brand-close {
          display: block;
        }

        /* ───────────── USER CARD ───────────── */
        .na-user-card {
          margin: 14px 14px 0;
          padding: 10px 12px;
          background: rgba(148, 163, 184, 0.04);
          border: 1px solid rgba(148, 163, 184, 0.06);
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .na-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #1e3a5f 0%, #1a2744 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #6384ff;
          flex-shrink: 0;
        }

        .na-user-info {
          min-width: 0;
          flex: 1;
        }

        .na-user-email {
          font-size: 11.5px;
          color: rgba(148, 163, 184, 0.7);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
        }

        .na-user-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 600;
          background: rgba(99, 132, 255, 0.1);
          color: #7c9aff;
          padding: 2px 7px;
          border-radius: 4px;
          margin-top: 3px;
          letter-spacing: 0.3px;
        }

        /* ───────────── NAV SCROLL AREA ───────────── */
        .na-nav-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px 10px 20px;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.08) transparent;
        }
        .na-nav-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .na-nav-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .na-nav-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.1);
          border-radius: 4px;
        }
        .na-nav-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.18);
        }

        /* ───────────── NAV SECTIONS ───────────── */
        .na-nav-section {
          margin-bottom: 18px;
        }
        .na-nav-section:last-child {
          margin-bottom: 0;
        }

        .na-nav-heading {
          font-size: 10.5px;
          font-weight: 600;
          color: rgba(148, 163, 184, 0.35);
          letter-spacing: 0.4px;
          padding: 0 10px;
          margin-bottom: 5px;
        }

        .na-nav-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        /* ───────────── NAV ITEMS ───────────── */
        .na-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 450;
          text-decoration: none;
          color: rgba(148, 163, 184, 0.75);
          position: relative;
          transition: color 0.15s, background 0.15s;
        }
        .na-nav-item:hover {
          color: #cbd5e1;
          background: rgba(148, 163, 184, 0.05);
        }

        .na-nav-item.active {
          color: #fff;
          background: rgba(99, 132, 255, 0.1);
          font-weight: 550;
        }
        .na-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 18px;
          background: #6384ff;
          border-radius: 0 3px 3px 0;
        }

        .na-nav-icon {
          font-size: 13px;
          width: 18px;
          text-align: center;
          flex-shrink: 0;
          line-height: 1;
        }

        .na-nav-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ───────────── LOGOUT FOOTER ───────────── */
        .na-sidebar-footer {
          padding: 14px;
          border-top: 1px solid rgba(148, 163, 184, 0.06);
        }

        .na-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.08);
          color: #f87171;
          font-size: 12.5px;
          font-weight: 550;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          font-family: inherit;
          transition: background 0.15s, border-color 0.15s;
        }
        .na-logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.15);
        }

        .na-logout-icon {
          font-size: 14px;
          line-height: 1;
        }

        /* ───────────── MAIN CONTENT ───────────── */
        .na-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow-x: hidden;
          background: #070a11;
        }

        .na-content {
          flex: 1;
          padding: clamp(16px, 2.5vw, 28px);
          width: 100%;
        }

        /* ───────────── MOBILE TOP BAR ───────────── */
        .na-mobile-bar {
          display: none;
          background: linear-gradient(180deg, #0c1020 0%, #0a0e1a 100%);
          border-bottom: 1px solid rgba(148, 163, 184, 0.06);
          padding: 10px 16px;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 990;
        }

        .na-mobile-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .na-hamburger {
          background: rgba(148, 163, 184, 0.06);
          color: #e2e8f0;
          border: 1px solid rgba(148, 163, 184, 0.08);
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 16px;
          cursor: pointer;
          line-height: 1;
          transition: background 0.15s;
          font-family: inherit;
        }
        .na-hamburger:hover {
          background: rgba(148, 163, 184, 0.1);
        }

        .na-mobile-brand {
          font-weight: 700;
          font-size: 14.5px;
          color: #f1f5f9;
          letter-spacing: -0.2px;
        }

        .na-mobile-live-link {
          color: #6384ff;
          font-size: 11.5px;
          text-decoration: none;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 6px;
          background: rgba(99, 132, 255, 0.06);
          border: 1px solid rgba(99, 132, 255, 0.1);
          transition: background 0.15s;
        }
        .na-mobile-live-link:hover {
          background: rgba(99, 132, 255, 0.12);
        }

        /* ───────────── OVERLAY ───────────── */
        .na-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(4, 6, 12, 0.75);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 998;
          opacity: 0;
          transition: opacity 0.25s;
        }
        .na-overlay.active {
          display: block;
          opacity: 1;
        }

        /* ───────────── RESPONSIVE ───────────── */
        @media (max-width: 900px) {
          .na-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: 8px 0 40px rgba(0, 0, 0, 0.45);
            width: 264px;
          }
          .na-sidebar.open {
            transform: translateX(0);
          }
          .na-mobile-bar {
            display: flex;
          }
          .na-brand-close {
            display: block;
          }
        }

        /* ───────────── EXTRA SMALL SCREENS ───────────── */
        @media (max-width: 400px) {
          .na-sidebar {
            width: 100%;
            max-width: 280px;
          }
          .na-content {
            padding: 12px;
          }
          .na-mobile-bar {
            padding: 8px 12px;
          }
        }
      `}</style>

      {/* Backdrop overlay for mobile */}
      <div
        className={`na-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`na-sidebar ${mobileMenuOpen ? 'open' : ''}`}>

        {/* Brand Header */}
        <div className="na-brand">
          <div className="na-brand-row">
            <div className="na-brand-logo-group">
              <div className="na-brand-icon">✎</div>
              <span className="na-brand-name">NewsAdmin</span>
            </div>
            <button
              className="na-brand-close"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="na-user-card">
          <div className="na-user-avatar">A</div>
          <div className="na-user-info">
            <div className="na-user-email">admin@news.com</div>
            <span className="na-user-badge">Super Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="na-nav-scroll">
          {navSections.map((sec) => (
            <div key={sec.heading} className="na-nav-section">
              <div className="na-nav-heading">{sec.heading}</div>
              <div className="na-nav-list">
                {sec.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`na-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <span className="na-nav-icon">{item.icon}</span>
                      <span className="na-nav-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="na-sidebar-footer">
          <button className="na-logout-btn" onClick={handleLogout}>
            <span className="na-logout-icon">↗</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="na-main">

        {/* Mobile Top Bar */}
        <header className="na-mobile-bar">
          <div className="na-mobile-left">
            <button
              className="na-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <span className="na-mobile-brand">NewsAdmin</span>
          </div>
          <Link href="/" target="_blank" className="na-mobile-live-link">
            Live Portal ↗
          </Link>
        </header>

        {/* Page Content */}
        <main className="na-content">
          {children}
        </main>
      </div>
    </div>
  );
}