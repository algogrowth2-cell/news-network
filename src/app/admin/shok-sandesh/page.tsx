'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function ShokSandeshPage() {
  const [entries] = useState<any[]>([]);

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>शोक संदेश / श्रद्धांजलि ({entries.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Obituary notices, memorial listings & condolences</p>
        </div>
        <button className={styles.btnPrimary}>+ New Entry</button>
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
            <tr>
              <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                No condolences recorded yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}