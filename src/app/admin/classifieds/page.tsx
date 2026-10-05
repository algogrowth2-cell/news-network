'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function ClassifiedsPage() {
  const [ads] = useState<any[]>([]);

  return (
    <div style={{ color: 'var(--fg-fff)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Classified Ads ({ads.length})</h1>
          <p style={{ fontSize: '13px', color: 'var(--fg-94a3b8)' }}>Local community advertisements, real estate & notices</p>
        </div>
        <button className={styles.btnPrimary}>+ New Ad</button>
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bd-1e293b)', background: 'var(--bg-0b1120)', color: 'var(--fg-94a3b8)' }}>
              <th style={{ padding: '14px 16px' }}>Category</th>
              <th style={{ padding: '14px 16px' }}>Title</th>
              <th style={{ padding: '14px 16px' }}>City</th>
              <th style={{ padding: '14px 16px' }}>Price</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Date</th>
              <th style={{ padding: '14px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--fg-94a3b8)' }}>
                No classified ads found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}