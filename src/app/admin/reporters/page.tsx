'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

export default function ReportersPage() {
  const [reporters, setReporters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReporters = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'reporters'));
      setReporters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReporters();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reporters', id), { status: newStatus });
      alert(`Reporter application is now ${newStatus.toUpperCase()}`);
      loadReporters();
    } catch (e: any) {
      alert('Error updating status: ' + e.message);
    }
  };

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Reporters ({reporters.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Review and approve new field reporter registrations</p>
        </div>
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
              <th style={{ padding: '14px 16px' }}>Name</th>
              <th style={{ padding: '14px 16px' }}>Email</th>
              <th style={{ padding: '14px 16px' }}>Beat</th>
              <th style={{ padding: '14px 16px' }}>City</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : reporters.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No journalist registration requests yet.</td></tr>
            ) : (
              reporters.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '12px 16px', color: '#38bdf8' }}>{r.email}</td>
                  <td style={{ padding: '12px 16px' }}>{r.beat || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{r.city || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      background: r.status === 'active' ? '#065f46' : '#854d0e', 
                      color: r.status === 'active' ? '#34d399' : '#fde047' 
                    }}>
                      {r.status || 'pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {r.status !== 'active' ? (
                      <button 
                        onClick={() => handleStatusChange(r.id, 'active')}
                        style={{ color: '#22c55e', background: 'none', border: '1px solid #22c55e', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
                      >
                        Approve
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusChange(r.id, 'pending')}
                        style={{ color: '#f59e0b', background: 'none', border: '1px solid #f59e0b', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
                      >
                        Suspend
                      </button>
                    )}
                    <button 
                      onClick={() => handleStatusChange(r.id, 'rejected')}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}