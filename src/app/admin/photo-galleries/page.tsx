'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function PhotoGalleriesPage() {
  const [galleries, setGalleries] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newGallery, setNewGallery] = useState({ title: '', category: 'Entertainment' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setGalleries([...galleries, { ...newGallery, id: Date.now().toString(), photoCount: 0, date: '2026-09-04' }]);
    setShowModal(false);
  };

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Photo Galleries ({galleries.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Curated visual albums and multi-photo news galleries</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.btnPrimary}>+ New Gallery</button>
      </div>

      <div className={styles.formCard}>
        {galleries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <p>No photo galleries published yet. Click "+ New Gallery" to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {galleries.map(g => (
              <div key={g.id} style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontWeight: 600, fontSize: '15px' }}>{g.title}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
                  <span>{g.category}</span>
                  <span>{g.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleCreate} className={styles.formCard} style={{ width: '450px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Create Photo Gallery</h2>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Gallery Title</label>
              <input type="text" required className={styles.inputControl} value={newGallery.title} onChange={e => setNewGallery({ ...newGallery, title: e.target.value })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Category</label>
              <select className={styles.inputControl} value={newGallery.category} onChange={e => setNewGallery({ ...newGallery, category: e.target.value })}>
                <option value="Entertainment">Entertainment</option>
                <option value="Sports">Sports</option>
                <option value="National">National</option>
                <option value="International">International</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="submit" className={styles.btnPrimary}>Create Gallery</button>
              <button type="button" onClick={() => setShowModal(false)} className={styles.btnPrimary} style={{ background: '#334155' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}