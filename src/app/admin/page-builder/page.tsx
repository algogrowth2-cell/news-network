'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function PageBuilder() {
  const [selectedSite, setSelectedSite] = useState('bazar-karobar');
  const [sections, setSections] = useState([
    'Breaking News Ticker',
    'Featured Grid',
    'Latest News',
    'Rashifal'
  ]);

  const library = [
    'Breaking News Ticker',
    'Featured Grid',
    'Latest News',
    'Trending',
    'Category Feed',
    'Video Feed',
    'Web Stories',
    'Photo Gallery',
    'Rashifal',
    'Ad Banner',
    'Custom HTML'
  ];

  const addSection = (item: string) => {
    setSections([...sections, item]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Page Builder</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Design home page section layouts per website</p>
        </div>
        <button onClick={() => alert('Layout saved!')} className={styles.btnPrimary}>Save Layout</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Active Canvas */}
        <div className={styles.formCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontWeight: 700 }}>Homepage Canvas</span>
            <select 
              className={styles.inputControl} 
              style={{ width: '200px', padding: '4px 8px' }}
              value={selectedSite} 
              onChange={e => setSelectedSite(e.target.value)}
            >
              <option value="bazar-karobar">Bazar Karobar</option>
              <option value="the-local-leader">The Local Leader</option>
              <option value="desh-ki-awaz">Desh Ki Awaz</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sections.map((sec, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: '14px', 
                  background: '#0b1120', 
                  border: '1px solid #334155', 
                  borderRadius: '6px', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 600 }}>{idx + 1}. {sec}</span>
                <button onClick={() => removeSection(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Available Component Library */}
        <div className={styles.formCard}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Add Section</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {library.map((item) => (
              <button
                key={item}
                onClick={() => addSection(item)}
                style={{
                  padding: '10px',
                  background: '#0b1120',
                  border: '1px dashed #475569',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                + {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}