'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function MediaLibraryPage() {
  const [images] = useState([
    { id: '1', title: 'PM Modi & Belgium Delegation', url: 'https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=600&auto=format&fit=crop', size: '2.4 MB' }
  ]);

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Media Library ({images.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Central image and asset storage for news networks</p>
        </div>
        <button className={styles.btnPrimary}>+ Upload Image</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
        {images.map(img => (
          <div key={img.id} className={styles.formCard} style={{ padding: '10px' }}>
            <div style={{ width: '100%', height: '150px', background: '#0b1120', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <img src={img.url} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.title}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{img.size}</div>
          </div>
        ))}
      </div>
    </div>
  );
}