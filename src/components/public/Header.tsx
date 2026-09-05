import Link from 'next/link';
import styles from './Header.module.css';

interface HeaderProps {
  site: {
    name: string;
    logoUrl: string;
    language: string;
  };
  categories: Array<{ slug: string; nameHi: string; nameEn: string }>;
}

export default function Header({ site, categories }: HeaderProps) {
  const today = new Date().toLocaleDateString(site.language === 'hi' ? 'hi-IN' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header>
      <div className={styles.topBar}>
        <div className={`container ${styles.topBarContent}`}>
          <div>{today}</div>
          <div className={styles.topLinks}>
            <Link href="/membership" className={styles.membershipBadge}>Membership</Link>
            <Link href="/epaper">E-Paper</Link>
            <Link href="/admin">Admin Login</Link>
          </div>
        </div>
      </div>

      <div className={`container ${styles.brandingBar}`}>
        <div className={styles.logoArea}>
          <Link href="/">
            <img src={site.logoUrl || "/placeholder-logo.png"} alt={site.name} className={styles.logoImg} />
          </Link>
        </div>
        <div className={styles.headerAdSlot}>Header Ad Zone (468x60)</div>
      </div>

      <nav className={styles.navbar}>
        <div className={`container ${styles.navLinks}`}>
          <Link href="/" className={styles.navItem}>Home</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className={styles.navItem}>
              {site.language === 'hi' ? c.nameHi : c.nameEn}
            </Link>
          ))}
          <Link href="/rashifal" className={styles.navItem}>Rashifal</Link>
        </div>
      </nav>
    </header>
  );
}