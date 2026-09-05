'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function ObituariesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'शोक संदेश',
    deceased: '',
    family: '',
    city: '',
    date: '2026-09-04',
    status: 'Active'
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setEntries([...entries, { ...formData, id: Date.now().toString() }]);
    setShowModal(false);
    setFormData({
      type: 'शोक संदेश',
      deceased: '',
      family: '',
      city: '',
      date: '2026-09-04',
      status: 'Active'
    });
  };

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>शोक संदेश / श्रद्धांजलि ({entries.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Obituary notices, memorial listings & condolences</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.btnPrimary}>+ New Entry</button>
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
              <th style={{ padding: '14px 16px' }}>Type</th>
              <th style={{ padding: '14px 16px' }}>Deceased</th>
              <th style={{ padding: '14px 16px' }}>Family</th>
              <th style={{ padding: '14px 16px' }}>City</th>
              <th style={{ padding: '14px 16px' }}>Date</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  No condolences recorded yet.
                </td>
              </tr>
            ) : (
              entries.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 16px' }}>{e.type}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{e.deceased}</td>
                  <td style={{ padding: '12px 16px' }}>{e.family}</td>
                  <td style={{ padding: '12px 16px' }}>{e.city}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{e.date}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#065f46', color: '#34d399' }}>{e.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleCreate} className={styles.formCard} style={{ width: '480px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Add Obituary Entry</h2>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Type</label>
              <select className={styles.inputControl} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                <option value="शोक संदेश">शोक संदेश</option>
                <option value="श्रद्धांजलि">श्रद्धांजलि</option>
                <option value="उठावना">उठावना</option>
                <option value="तेरहवीं">तेरहवीं</option>
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Deceased Name (दिवंगत का नाम)</label>
              <input type="text" required className={styles.inputControl} value={formData.deceased} onChange={e => setFormData({ ...formData, deceased: e.target.value })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Family / Shokakul (शोकाकुल)</label>
              <input type="text" className={styles.inputControl} value={formData.family} onChange={e => setFormData({ ...formData, family: e.target.value })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>City</label>
              <input type="text" className={styles.inputControl} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="submit" className={styles.btnPrimary}>Save Entry</button>
              <button type="button" onClick={() => setShowModal(false)} className={styles.btnPrimary} style={{ background: '#334155' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}