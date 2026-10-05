'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ADMIN_THEME_CSS, ADMIN_THEME_KEY, type AdminTheme } from './adminTheme';

/* Layout styles (sirf design): desktop me fixed sidebar, mobile me drawer */
const AL_STYLES = `
.al-root{min-height:100vh;background:var(--a-page);transition:background-color .2s ease;color:var(--fg-e2e8f0);font-family:system-ui,-apple-system,sans-serif}
.al-root *{box-sizing:border-box}
.al-backdrop{display:none}
.al-sidebar{position:fixed;top:0;left:0;bottom:0;width:250px;background:var(--bg-0b1120);border-right:1px solid var(--bd-1e293b);display:flex;flex-direction:column;z-index:60;transition:transform .22s ease}
.al-brand{display:flex;align-items:center;gap:10px;padding:18px 18px 14px;border-bottom:1px solid var(--bd-1e293b)}
.al-brand-ic{width:36px;height:36px;border-radius:10px;background:#ea580c;display:grid;place-items:center;font-size:18px;flex-shrink:0}
.al-brand-name{font-size:16px;font-weight:800;color:var(--fg-fff);line-height:1.2}
.al-brand-sub{font-size:11px;color:#64748b}
.al-user{margin:14px 14px 6px;padding:10px 12px;background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:10px;display:flex;align-items:center;gap:10px}
.al-avatar{width:32px;height:32px;border-radius:50%;background:var(--bg-1e293b);display:grid;place-items:center;font-size:14px;flex-shrink:0}
.al-user-role{font-size:11px;color:#10b981;font-weight:700}
.al-user-email{font-size:12px;color:var(--fg-cbd5e1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.al-nav{flex:1;overflow-y:auto;padding:6px 10px 12px}
.al-heading{font-size:10.5px;font-weight:700;letter-spacing:.08em;color:#475569;text-transform:uppercase;padding:14px 10px 6px}
.al-link{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;color:var(--fg-94a3b8);text-decoration:none;font-size:13.5px;font-weight:500;transition:background .15s,color .15s}
.al-link:hover{background:var(--bg-111827);color:var(--fg-fff)}
.al-link.on{background:rgba(234,88,12,.14);color:var(--fg-fb923c);font-weight:700}
.al-link-ic{width:20px;text-align:center;font-size:14px}
.al-logout-wrap{padding:12px 14px 16px;border-top:1px solid var(--bd-1e293b)}
.al-logout{width:100%;padding:10px;border-radius:9px;border:1px solid var(--bd-7f1d1d);background:rgba(239,68,68,.1);color:var(--fg-fca5a5);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
.al-logout:hover{background:rgba(239,68,68,.2)}
.al-main{margin-left:250px;min-height:100vh;display:flex;flex-direction:column}
.al-topbar{display:none}
.al-content{flex:1;min-width:0}
.al-theme{display:flex;align-items:center;gap:4px;margin:4px 14px 6px;padding:3px;border-radius:10px;background:var(--bg-0f172a);border:1px solid var(--bd-1e293b)}
.al-theme button{flex:1;border:0;border-radius:7px;padding:7px 6px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;background:transparent;color:var(--fg-94a3b8)}
.al-theme button.on{background:#ea580c;color:#fff}
.al-theme button:focus-visible{outline:2px solid #fb923c;outline-offset:1px}
.al-theme-mini{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);color:var(--fg-fff);border-radius:8px;width:38px;height:38px;font-size:16px;cursor:pointer}
.al-loading{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-020617);color:var(--fg-94a3b8);font-family:system-ui,-apple-system,sans-serif;font-size:14px}
@media(max-width:900px){
  .al-sidebar{transform:translateX(-100%);width:270px;max-width:85vw}
  .al-sidebar.open{transform:translateX(0);box-shadow:8px 0 30px rgba(0,0,0,.5)}
  .al-backdrop.open{display:block;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:55}
  .al-main{margin-left:0}
  .al-topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;position:sticky;top:0;z-index:40;background:var(--bg-0b1120);border-bottom:1px solid var(--bd-1e293b);padding:10px 14px}
  .al-menu-btn{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);color:var(--fg-fff);border-radius:8px;width:38px;height:38px;font-size:18px;cursor:pointer}
  .al-top-title{font-size:15px;font-weight:800;color:var(--fg-fff)}
  .al-top-link{font-size:12.5px;color:var(--fg-fb923c);text-decoration:none;font-weight:600}
}
`;

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState('goldenpearlnews@gmail.com');
  // Light default; admin ki pasand (light/dark) browser me yaad rehti hai
  const [theme, setTheme] = useState<AdminTheme>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_THEME_KEY);
      if (saved === 'dark' || saved === 'light') setTheme(saved);
    } catch {
      /* storage band — light hi rahega */
    }
  }, []);

  const changeTheme = (next: AdminTheme) => {
    setTheme(next);
    try {
      localStorage.setItem(ADMIN_THEME_KEY, next);
    } catch {
      /* ignore */
    }
  };
  const pathname = usePathname();
  const router = useRouter();

  // 1. STRICT AUTH CHECK: Valid session check
  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsCheckingAuth(false);
      return;
    }

    const adminUser = localStorage.getItem('admin_user');
    const adminToken = localStorage.getItem('admin_token');

    // Agar adminUser exist karta hai toh login valid hai
    if (!adminUser && !adminToken) {
      setIsAuthenticated(false);
      router.replace('/admin/login');
    } else {
      if (adminUser) {
        try {
          const parsed = JSON.parse(adminUser);
          if (parsed?.email) setAdminEmail(parsed.email);
        } catch (e) {
          console.error(e);
        }
      }
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
    sessionStorage.removeItem('admin_user');
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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
      <div className="al-root" data-theme={theme}>
        <style dangerouslySetInnerHTML={{ __html: ADMIN_THEME_CSS + AL_STYLES }} />
        <div className="al-loading">Verifying credentials…</div>
      </div>
    );
  }

  // Navigation sections — unchanged
  const navSections = [
    {
      heading: 'Main',
      items: [{ label: 'Dashboard', icon: '⊞', href: '/admin' }]
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
        { label: 'Rashifal', icon: '⭐', href: '/admin/rashifal' }
      ]
    },
    {
      heading: 'Modules',
      items: [
        { label: 'Reporters', icon: '🧑‍💼', href: '/admin/reporters' },
        { label: 'Press ID Cards', icon: '🪪', href: '/admin/press-cards' },
        { label: 'Ads & Revenue', icon: '📢', href: '/admin/ads' },
        { label: 'Classifieds', icon: '📋', href: '/admin/classifieds' },
        { label: 'Shok Sandesh', icon: '🕊️', href: '/admin/obituaries' },
        { label: 'Membership', icon: '💳', href: '/admin/membership' },
        { label: 'Referrals', icon: '🎁', href: '/admin/referrals' },
        { label: 'Comments', icon: '💬', href: '/admin/comments' },
        { label: 'Analytics', icon: '📊', href: '/admin/analytics' }
      ]
    },
    {
      heading: 'System',
      items: [
        { label: 'Sites', icon: '🌐', href: '/admin/sites' },
        { label: 'Page Builder', icon: '🧱', href: '/admin/page-builder' },
        { label: 'Users', icon: '👥', href: '/admin/users' },
        { label: 'Audit Log', icon: '🛡️', href: '/admin/audit-log' },
        { label: 'Settings', icon: '⚙️', href: '/admin/settings' }
      ]
    }
  ];

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="al-root" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_THEME_CSS + AL_STYLES }} />

      {/* Backdrop overlay for mobile */}
      <div className={`al-backdrop${mobileMenuOpen ? ' open' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* SIDEBAR */}
      <aside className={`al-sidebar${mobileMenuOpen ? ' open' : ''}`}>
        {/* Brand Header */}
        <div className="al-brand">
          <div className="al-brand-ic">📰</div>
          <div>
            <div className="al-brand-name">NewsAdmin</div>
            <div className="al-brand-sub">Golden Pearl Network</div>
          </div>
        </div>

        {/* User Card */}
        <div className="al-user">
          <div className="al-avatar">👤</div>
          <div style={{ minWidth: 0 }}>
            <div className="al-user-role">SUPER ADMIN</div>
            <div className="al-user-email">{adminEmail}</div>
          </div>
        </div>

        {/* Light / Dark switch */}
        <div className="al-theme" role="group" aria-label="Admin theme">
          <button type="button" className={theme === 'light' ? 'on' : ''} aria-pressed={theme === 'light'} onClick={() => changeTheme('light')}>
            ☀️ Light
          </button>
          <button type="button" className={theme === 'dark' ? 'on' : ''} aria-pressed={theme === 'dark'} onClick={() => changeTheme('dark')}>
            🌙 Dark
          </button>
        </div>

        {/* Navigation */}
        <nav className="al-nav">
          {navSections.map((section) => (
            <div key={section.heading}>
              <div className="al-heading">{section.heading}</div>
              {section.items.map((item) => (
                <Link key={item.href} href={item.href} className={`al-link${isActive(item.href) ? ' on' : ''}`}>
                  <span className="al-link-ic">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="al-logout-wrap">
          <button className="al-logout" onClick={handleLogout}>
            ⎋ Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="al-main">
        {/* Mobile Top Bar */}
        <div className="al-topbar">
          <button className="al-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            ☰
          </button>
          <span className="al-top-title">NewsAdmin</span>
          <button
            type="button"
            className="al-theme-mini"
            onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href="/" target="_blank" className="al-top-link">
            Live Portal ↗
          </Link>
        </div>

        {/* Page Content */}
        <main className="al-content">{children}</main>
      </div>
    </div>
  );
}