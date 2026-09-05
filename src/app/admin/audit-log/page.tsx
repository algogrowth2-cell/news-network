'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function AuditLogPage() {
  const [logs] = useState([
    { id: '1', time: '05:55:08', user: 'Super Admin', role: 'super_admin', action: 'article.create', entity: 'article #6', details: 'Created Hindi news release' },
    { id: '2', time: '05:52:10', user: 'Super Admin', role: 'super_admin', action: 'article.create', entity: 'article #5', details: 'Published Business bulletin' },
    { id: '3', time: '05:48:42', user: 'Super Admin', role: 'super_admin', action: 'site.update', entity: 'site: bazar-karobar', details: 'Modified theme primary palette' },
    { id: '4', time: '05:30:19', user: 'Super Admin', role: 'super_admin', action: 'user.login', entity: 'auth/session', details: 'Successful administrative login' },
    { id: '5', time: '05:15:02', user: 'Super Admin', role: 'super_admin', action: 'database.init', entity: 'system: collections', details: 'Initialized Firebase Firestore' }
  ]);

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Audit Log ({logs.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Security tracking and administrator activity logs</p>
        </div>
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
              <th style={{ padding: '14px 16px' }}>Time</th>
              <th style={{ padding: '14px 16px' }}>User</th>
              <th style={{ padding: '14px 16px' }}>Role</th>
              <th style={{ padding: '14px 16px' }}>Action</th>
              <th style={{ padding: '14px 16px' }}>Entity</th>
              <th style={{ padding: '14px 16px' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'monospace' }}>{l.time}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{l.user}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ color: '#818cf8' }}>{l.role}</span></td>
                <td style={{ padding: '12px 16px' }}>
                  <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155' }}>
                    {l.action}
                  </code>
                </td>
                <td style={{ padding: '12px 16px', color: '#38bdf8' }}>{l.entity}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}