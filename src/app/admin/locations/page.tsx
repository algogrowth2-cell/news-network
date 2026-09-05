'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function LocationsPage() {
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra'
  ];

  const cities = [
    { name: 'Visakhapatnam', nameHi: 'विशाखापट्टनम', slug: 'visakhapatnam', status: 'Active' },
    { name: 'Vijayawada', nameHi: 'विजयवाड़ा', slug: 'vijayawada', status: 'Active' },
    { name: 'Guntur', nameHi: 'गुंटूर', slug: 'guntur', status: 'Active' },
    { name: 'Nellore', nameHi: 'नेल्लोर', slug: 'nellore', status: 'Active' },
    { name: 'Tirupati', nameHi: 'तिरुपति', slug: 'tirupati', status: 'Active' },
  ];

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>States & Cities</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Geographical news-mapping database</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className={styles.formCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>States ({states.length})</h3>
            <button className={styles.btnPrimary} style={{ padding: '4px 10px', fontSize: '12px' }}>+ Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '550px', overflowY: 'auto' }}>
            {states.map(st => (
              <div 
                key={st}
                onClick={() => setSelectedState(st)}
                style={{ 
                  padding: '10px 14px', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: selectedState === st ? '#2563eb' : '#0b1120',
                  color: selectedState === st ? '#fff' : '#94a3b8',
                  fontSize: '13.5px'
                }}
              >
                {st}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Cities in {selectedState} ({cities.length})</h3>
            <button className={styles.btnPrimary} style={{ padding: '4px 10px', fontSize: '12px' }}>+ Add City</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Hindi Name</th>
                <th style={{ padding: '10px' }}>Slug</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {cities.map(c => (
                <tr key={c.slug} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '12px 10px' }}>{c.nameHi}</td>
                  <td style={{ padding: '12px 10px', color: '#94a3b8' }}>{c.slug}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#065f46', color: '#34d399' }}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}