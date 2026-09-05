'use client';
import { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

const RASHI_LIST = [
  { id: 'aries', name: 'मेष (Aries)', sign: '♈' },
  { id: 'taurus', name: 'वृषभ (Taurus)', sign: '♉' },
  { id: 'gemini', name: 'मिथुन (Gemini)', sign: '♊' },
  { id: 'cancer', name: 'कर्क (Cancer)', sign: '♋' },
  { id: 'leo', name: 'सिंह (Leo)', sign: '♌' },
  { id: 'virgo', name: 'कन्या (Virgo)', sign: '♍' },
  { id: 'libra', name: 'तुला (Libra)', sign: '♎' },
  { id: 'scorpio', name: 'वृश्चिक (Scorpio)', sign: '♏' },
  { id: 'sagittarius', name: 'धनु (Sagittarius)', sign: '♐' },
  { id: 'capricorn', name: 'मकर (Capricorn)', sign: '♑' },
  { id: 'aquarius', name: 'कुंभ (Aquarius)', sign: '♒' },
  { id: 'pisces', name: 'मीन (Pisces)', sign: '♓' }
];

export default function AdminRashifalPage() {
  const [selectedRashi, setSelectedRashi] = useState(RASHI_LIST[0]);
  const [date, setDate] = useState('2026-09-05');
  const [prediction, setPrediction] = useState('');
  const [luckyNumber, setLuckyNumber] = useState('');
  const [luckyColor, setLuckyColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [rashifalMap, setRashifalMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rashifal'), (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.docs.forEach((docSnap) => {
        map[docSnap.id] = docSnap.data();
      });
      setRashifalMap(map);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const current = rashifalMap[selectedRashi.id];
    if (current) {
      setPrediction(current.prediction || '');
      setLuckyNumber(current.luckyNumber || '');
      setLuckyColor(current.luckyColor || '');
      setDate(current.date || '2026-09-05');
    } else {
      setPrediction('');
      setLuckyNumber('');
      setLuckyColor('');
    }
  }, [selectedRashi, rashifalMap]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prediction.trim()) return alert('कृपया राशिफल भविष्यफल दर्ज करें');

    setLoading(true);
    try {
      await setDoc(doc(db, 'rashifal', selectedRashi.id), {
        rashiId: selectedRashi.id,
        rashiName: selectedRashi.name,
        sign: selectedRashi.sign,
        prediction,
        luckyNumber,
        luckyColor,
        date,
        updatedAt: serverTimestamp()
      });
      alert(`${selectedRashi.name} का राशिफल सफलतापूर्वक अपडेट हो गया!`);
    } catch (err: any) {
      alert('Error updating rashifal: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ color: '#fff', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>दैनिक राशिफल प्रबंधन (Daily Horoscope)</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>12 राशियों का दैनिक राशिफल, शुभ अंक और शुभ रंग लाइव अपडेट करें</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Rashi Select Sidebar */}
        <div className={styles.formCard} style={{ padding: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, padding: '8px 12px', borderBottom: '1px solid #1e293b', marginBottom: '8px' }}>
            राशियां चुनें
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {RASHI_LIST.map((r) => {
              const isSelected = selectedRashi.id === r.id;
              const hasData = Boolean(rashifalMap[r.id]?.prediction);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRashi(r)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected ? '#ea580c' : '#0b1120',
                    color: '#fff',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{r.sign} {r.name}</span>
                  <span style={{ fontSize: '11px', color: isSelected ? '#fff' : hasData ? '#4ade80' : '#94a3b8' }}>
                    {hasData ? '● अपडेटेड' : '○ रिक्त'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prediction Form */}
        <div className={styles.formCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '14px' }}>
            <span style={{ fontSize: '28px' }}>{selectedRashi.sign}</span>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{selectedRashi.name}</h2>
              <span style={{ fontSize: '12px', color: '#ea580c' }}>दैनिक राशिफल विवरण दर्ज करें</span>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>दिनांक (Date)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.inputControl}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>दैनिक भविष्यवाणी (Horoscope Prediction) *</label>
              <textarea
                rows={6}
                required
                placeholder={`आज ${selectedRashi.name} के जातकों का दिन कैसा रहेगा...`}
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
                className={styles.inputControl}
                style={{ resize: 'vertical', lineHeight: '1.6' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>शुभ अंक (Lucky Number)</label>
                <input
                  type="text"
                  placeholder="उदा. 7, 9"
                  value={luckyNumber}
                  onChange={(e) => setLuckyNumber(e.target.value)}
                  className={styles.inputControl}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>शुभ रंग (Lucky Color)</label>
                <input
                  type="text"
                  placeholder="उदा. पीला, लाल"
                  value={luckyColor}
                  onChange={(e) => setLuckyColor(e.target.value)}
                  className={styles.inputControl}
                />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <button
                type="submit"
                disabled={loading}
                className={styles.btnPrimary}
                style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              >
                {loading ? 'अपडेट हो रहा है...' : `💾 ${selectedRashi.name} का राशिफल प्रकाशित करें`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}