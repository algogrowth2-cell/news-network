'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function MembershipPage() {
  const [plans] = useState([
    { name: 'Basic', price: '₹99.00/mo', desc: 'Ad-free reading experience for casual readers', popular: false },
    { name: 'Premium', price: '₹249.00/mo', desc: 'Full access + premium articles & downloads', popular: true },
    { name: 'Annual Premium', price: '₹1799.00/year', desc: 'Best value - save 40% with all perks included', popular: false }
  ]);

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Membership Plans (3)</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Manage paywall subscriptions and reader billing tiers</p>
        </div>
        <button className={styles.btnPrimary}>+ Add Plan</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {plans.map(p => (
          <div key={p.name} className={styles.formCard} style={{ borderTop: p.popular ? '4px solid #2563eb' : '1px solid #334155' }}>
            {p.popular && <span style={{ fontSize: '10px', background: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>POPULAR</span>}
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '8px' }}>{p.name}</h3>
            <div style={{ fontSize: '24px', fontWeight: 800, margin: '10px 0', color: '#38bdf8' }}>{p.price}</div>
            <p style={{ fontSize: '13px', color: '#94a3b8', minHeight: '40px' }}>{p.desc}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className={styles.btnPrimary} style={{ fontSize: '12px', padding: '6px 12px', width: '100%' }}>Edit Plan</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}