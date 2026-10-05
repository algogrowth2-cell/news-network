'use client';
import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CONSENT_VERSION } from '@/lib/consent';
import styles from '../Admin.module.css';

interface Row {
  id: string;
  role: string;
  phone: string;
  version: string;
  marketing: boolean;
  ageConfirmed: boolean;
  action: string;
  page: string;
  at: Date | null;
}

const ROLE_HI: Record<string, string> = { reader: 'पाठक', patrakar: 'पत्रकार', advertiser: 'विज्ञापनदाता' };
const ACTION_HI: Record<string, string> = {
  signup: 'साइन अप पर सहमति',
  login: 'लॉगिन पर सहमति',
  marketing_opt_in: 'मार्केटिंग चालू',
  marketing_withdrawn: 'मार्केटिंग वापस ली'
};

const CSS = `
.cl-table{width:100%;border-collapse:collapse;font-size:13px;min-width:900px}
.cl-table th{text-align:left;padding:12px 14px;background:var(--bg-0b1120);color:var(--fg-94a3b8);font-weight:600;border-bottom:1px solid var(--bd-1e293b);white-space:nowrap}
.cl-table td{padding:10px 14px;border-bottom:1px solid var(--bd-1e293b)}
.cl-in{background:var(--bg-020617);border:1px solid var(--bd-334155);color:var(--fg-fff);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;font-family:inherit}
.cl-pill{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px}
`;

/* DPDP: sahmati ka saboot — kisne, kab, kis notice-version par, marketing haan/nahi */
export default function ConsentLogPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'consents'), orderBy('acceptedAt', 'desc'), limit(500)),
      (snap) => {
        setRows(
          snap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              role: x.role || '',
              phone: x.phone || '',
              version: x.version || '',
              marketing: x.marketing === true,
              ageConfirmed: x.ageConfirmed === true,
              action: x.action || '',
              page: x.page || '',
              at: x.acceptedAt?.toDate ? x.acceptedAt.toDate() : null
            };
          })
        );
        setLoading(false);
      },
      (err) => {
        setError('रिकॉर्ड लोड नहीं हुए: ' + err.message);
        setLoading(false);
      }
    );
  }, []);

  const visible = useMemo(
    () => rows.filter((r) => (!role || r.role === role) && (!search.trim() || r.phone.includes(search.trim()))),
    [rows, role, search]
  );
  const uniquePeople = new Set(rows.map((r) => `${r.role}_${r.phone}`)).size;
  const marketingYes = rows.filter((r) => r.marketing && (r.action === 'signup' || r.action === 'login' || r.action === 'marketing_opt_in')).length;

  return (
    <div style={{ color: 'var(--fg-fff)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>🔒 Consent Log (DPDP)</h1>
        <p style={{ fontSize: '13px', color: 'var(--fg-94a3b8)' }}>
          हर पाठक, पत्रकार और विज्ञापनदाता की सहमति का सबूत — कब, किस नोटिस संस्करण पर। मौजूदा संस्करण: <b>{CONSENT_VERSION}</b>
        </p>
      </div>
      {error && <div style={{ color: 'var(--fg-fca5a5)', marginBottom: '12px', fontSize: '13px' }}>⚠️ {error}</div>}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {[
          ['कुल रिकॉर्ड', rows.length],
          ['उपयोगकर्ता', uniquePeople],
          ['मार्केटिंग सहमति', marketingYes]
        ].map(([l, v]) => (
          <div key={l as string} className={styles.formCard} style={{ padding: '12px 16px', minWidth: '150px', margin: 0 }}>
            <div style={{ fontSize: '12px', color: 'var(--fg-94a3b8)', fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{v as number}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <input className="cl-in" style={{ flex: 1, minWidth: '220px' }} placeholder="मोबाइल नंबर से खोजें…" value={search} onChange={(e) => setSearch(e.target.value.replace(/[^0-9]/g, ''))} />
        <select className="cl-in" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">सभी</option>
          <option value="reader">पाठक</option>
          <option value="patrakar">पत्रकार</option>
          <option value="advertiser">विज्ञापनदाता</option>
        </select>
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table className="cl-table">
          <thead>
            <tr>
              <th>समय</th>
              <th>मोबाइल</th>
              <th>खाता</th>
              <th>क्या हुआ</th>
              <th>नोटिस संस्करण</th>
              <th>18+</th>
              <th>मार्केटिंग</th>
              <th>पेज</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--fg-94a3b8)' }}>
                  लोड हो रहा है…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: 'var(--fg-94a3b8)' }}>
                  कोई रिकॉर्ड नहीं
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.at ? r.at.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td>+91 {r.phone}</td>
                  <td>{ROLE_HI[r.role] || r.role}</td>
                  <td>{ACTION_HI[r.action] || r.action}</td>
                  <td>
                    <span className="cl-pill" style={r.version === CONSENT_VERSION ? { background: 'var(--bg-065f46)', color: 'var(--fg-34d399)' } : { background: 'var(--bg-451a03)', color: 'var(--fg-fbbf24)' }}>
                      {r.version || '—'}
                    </span>
                  </td>
                  <td>{r.action.startsWith('marketing') ? '—' : r.ageConfirmed ? '✓' : '—'}</td>
                  <td>{r.marketing ? '✓ हाँ' : 'नहीं'}</td>
                  <td style={{ color: 'var(--fg-94a3b8)' }}>{r.page || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
