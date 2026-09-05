'use client';
import styles from '../Admin.module.css';

export default function AnalyticsPage() {
  const cards = [
    { label: 'Total Articles', val: '6', color: '#3b82f6' },
    { label: 'Total Users', val: '3', color: '#a855f7' },
    { label: 'Active Subscriptions', val: '1', color: '#10b981' },
    { label: 'Active Ads', val: '1', color: '#f97316' },
    { label: 'Est. Ad Revenue (30d)', val: '₹4.02', color: '#14b8a6' },
    { label: 'Total Impressions', val: '46', color: '#06b6d4' },
    { label: 'Total Clicks', val: '2', color: '#8b5cf6' },
    { label: 'Conversion Rate', val: '33.3%', color: '#ec4899' }
  ];

  return (
    <div style={{ color: '#fff' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>Performance Analytics</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map(c => (
          <div key={c.label} className={styles.formCard} style={{ borderLeft: `4px solid ${c.color}` }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px' }}>{c.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}