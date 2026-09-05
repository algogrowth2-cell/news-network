'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function loadUsers() {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    loadUsers();
  }, []);

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Staff & Readers ({users.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Manage admin roles and reader accounts</p>
        </div>
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
              <th style={{ padding: '14px 16px' }}>Name</th>
              <th style={{ padding: '14px 16px' }}>Email</th>
              <th style={{ padding: '14px 16px' }}>Role</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.name || 'User'}</td>
                <td style={{ padding: '12px 16px', color: '#38bdf8' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#1e3a8a', color: '#93c5fd' }}>
                    {u.role || 'user'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#065f46', color: '#34d399' }}>
                    {u.status || 'verified'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}