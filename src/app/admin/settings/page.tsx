'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'password' | 'security'>('account');
  const [profile, setProfile] = useState({
    name: 'Super Admin',
    email: 'admin@newsnetwork.com',
    phone: '+91 98765 43210',
    bio: 'Chief Editor & Network Administrator'
  });

  return (
    <div style={{ color: '#fff' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>Account Settings</h1>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
        {(['account', 'password', 'security'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === tab ? '#2563eb' : '#0b1120',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13.5px',
              textTransform: 'capitalize',
              fontWeight: 600
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.formCard} style={{ maxWidth: '600px' }}>
        {activeTab === 'account' && (
          <form onSubmit={e => { e.preventDefault(); alert('Profile updated!'); }}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Display Name</label>
              <input type="text" className={styles.inputControl} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Email Address</label>
              <input type="email" disabled className={styles.inputControl} value={profile.email} style={{ opacity: 0.7 }} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Phone</label>
              <input type="text" className={styles.inputControl} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Bio</label>
              <textarea rows={3} className={styles.inputControl} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
            </div>
            <button type="submit" className={styles.btnPrimary}>Save Changes</button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={e => { e.preventDefault(); alert('Password updated!'); }}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Current Password</label>
              <input type="password" required className={styles.inputControl} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>New Password</label>
              <input type="password" required className={styles.inputControl} />
            </div>
            <button type="submit" className={styles.btnPrimary}>Update Password</button>
          </form>
        )}

        {activeTab === 'security' && (
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Two-Factor Authentication</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Enhance account security with SMS or Authenticator verification.</p>
            <button className={styles.btnPrimary}>Enable 2FA</button>
          </div>
        )}
      </div>
    </div>
  );
}