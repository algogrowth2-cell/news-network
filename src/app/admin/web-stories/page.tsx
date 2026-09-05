'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function WebStoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', coverImage: '', site: 'Bazar Karobar' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setStories([...stories, { ...newStory, id: Date.now().toString(), slides: 1, date: '2026-09-04' }]);
    setShowModal(false);
    setNewStory({ title: '', coverImage: '', site: 'Bazar Karobar' });
  };

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Web Stories ({stories.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>AMP and vertical story format creator for mobile readers</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.btnPrimary}>+ New Story</button>
      </div>

      <div className={styles.formCard}>
        {stories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <p>No stories created yet. Tap "+ New Story" to create a vertical mobile story.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {stories.map(s => (
              <div key={s.id} style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                <img src={s.coverImage || 'https://via.placeholder.com/300x500'} alt={s.title} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                <div style={{ padding: '10px' }}>
                  <p style={{ fontWeight: 600, fontSize: '13.5px' }}>{s.title}</p>
                  <span style={{ fontSize: '11px', color: '#38bdf8' }}>{s.site}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form onSubmit={handleCreate} className={styles.formCard} style={{ width: '450px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Create New Web Story</h2>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Story Headline</label>
              <input type="text" required className={styles.inputControl} value={newStory.title} onChange={e => setNewStory({ ...newStory, title: e.target.value })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Poster Image URL</label>
              <input type="text" className={styles.inputControl} placeholder="https://..." value={newStory.coverImage} onChange={e => setNewStory({ ...newStory, coverImage: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="submit" className={styles.btnPrimary}>Create Story</button>
              <button type="button" onClick={() => setShowModal(false)} className={styles.btnPrimary} style={{ background: '#334155' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}