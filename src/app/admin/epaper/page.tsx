'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function EPaperPage() {
  const [edition, setEdition] = useState({
    site: 'Bazar Karobar',
    date: '2026-09-04',
    city: 'Delhi',
    status: 'Draft',
    coverUrl: '',
    pdfUrl: ''
  });

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>E-Paper Editions (0)</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Publish digitized print editions and sliceable PDF newspapers</p>
        </div>
      </div>

      <div className={styles.formCard} style={{ maxWidth: '800px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Upload New E-Paper Edition</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Site</label>
            <select className={styles.inputControl} value={edition.site} onChange={e => setEdition({ ...edition, site: e.target.value })}>
              <option value="Bazar Karobar">Bazar Karobar</option>
              <option value="The Local Leader">The Local Leader</option>
              <option value="Desh Ki Awaz">Desh Ki Awaz</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Publish Date</label>
            <input type="date" className={styles.inputControl} value={edition.date} onChange={e => setEdition({ ...edition, date: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Edition / City (Optional)</label>
            <input type="text" className={styles.inputControl} value={edition.city} onChange={e => setEdition({ ...edition, city: e.target.value })} placeholder="e.g. Delhi, Mumbai" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Status</label>
            <select className={styles.inputControl} value={edition.status} onChange={e => setEdition({ ...edition, status: e.target.value })}>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>PDF Document URL</label>
          <input type="text" className={styles.inputControl} placeholder="https://.../newspaper.pdf" value={edition.pdfUrl} onChange={e => setEdition({ ...edition, pdfUrl: e.target.value })} />
        </div>

        <button onClick={() => alert('E-Paper created!')} className={styles.btnPrimary}>Create & Publish Issue</button>
      </div>
    </div>
  );
}