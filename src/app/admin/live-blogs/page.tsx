'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function LiveBlogsPage() {
  const [selectedArticle, setSelectedArticle] = useState('');
  const [activeSession, setActiveSession] = useState(false);
  const [feedItems, setFeedItems] = useState([
    { id: '1', time: '14:30', update: 'Bilateral talks conclude with strategic defense roadmap agreement signed.' }
  ]);
  const [postText, setPostText] = useState('');

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;
    setFeedItems([{ id: Date.now().toString(), time: 'Just now', update: postText }, ...feedItems]);
    setPostText('');
  };

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Live Blogs</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Real-time play-by-play breaking news ticker and live blog coverage</p>
        </div>
      </div>

      <div className={styles.formCard} style={{ maxWidth: '750px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Start Live Coverage</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className={styles.inputControl} 
            value={selectedArticle} 
            onChange={e => setSelectedArticle(e.target.value)}
          >
            <option value="">Select article for live coverage...</option>
            <option value="1">भारत-बेल्जियम रक्षा सहयोग को नई मजबूती</option>
            <option value="2">Sensex में 300 अंकों की तेजी</option>
          </select>
          <button 
            onClick={() => setActiveSession(true)} 
            className={styles.btnPrimary} 
            style={{ whiteSpace: 'nowrap' }}
          >
            Start Live Blog
          </button>
        </div>
      </div>

      {activeSession && (
        <div className={styles.formCard} style={{ maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>LIVE FEED ACTIVE</h3>
          </div>

          <form onSubmit={handlePostUpdate} style={{ marginBottom: '20px' }}>
            <textarea 
              rows={3} 
              className={styles.inputControl} 
              placeholder="Type breaking live bullet or key update..." 
              value={postText}
              onChange={e => setPostText(e.target.value)}
            />
            <button type="submit" className={styles.btnPrimary} style={{ marginTop: '8px' }}>Post Quick Update</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {feedItems.map(item => (
              <div key={item.id} style={{ borderLeft: '3px solid #38bdf8', paddingLeft: '12px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.time}</span>
                <p style={{ fontSize: '13.5px', marginTop: '3px' }}>{item.update}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}