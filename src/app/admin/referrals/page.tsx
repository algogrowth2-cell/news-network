'use client';
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ReferralRow {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerPhone: string;
  referredUserName: string;
  referredUserPhone: string;
  status: string;
  verifiedAutomatically: boolean;
  joinedAt: Date | null;
  codeUsed: string;
}

interface RewardInfo {
  status: string; // granted | claimed | pending_selection
  rewardType: string;
  validTill: Date | null;
}

const RF_STYLES = `
.rf-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px}
.rf-card{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px}
.rf-card-label{font-size:12px;color:#94a3b8;font-weight:600}
.rf-card-value{font-size:28px;font-weight:800;color:#fff;margin-top:6px}
.rf-top{grid-column:span 2}
.rf-top-row{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:6px 0;border-bottom:1px solid #1e293b;color:#cbd5e1}
.rf-top-row:last-child{border-bottom:0}
.rf-rank{color:#fb923c;font-weight:800;margin-right:6px}
.rf-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.rf-input{flex:1;min-width:220px;background:#0b1120;border:1px solid #334155;color:#fff;border-radius:8px;padding:9px 12px;font-size:13px;outline:none;font-family:inherit}
.rf-btn{background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:9px 14px;font-size:13px;cursor:pointer;font-family:inherit}
.rf-table-wrap{background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow-x:auto}
.rf-table{width:100%;border-collapse:collapse;font-size:13px;min-width:960px}
.rf-table th{text-align:left;padding:12px 14px;background:#0b1120;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e293b;white-space:nowrap}
.rf-table td{padding:11px 14px;border-bottom:1px solid #1e293b;color:#e2e8f0;vertical-align:top}
.rf-sub{display:block;font-size:11.5px;color:#64748b;margin-top:2px}
.rf-badge{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;white-space:nowrap}
.rf-empty{padding:40px;text-align:center;color:#64748b}
@media(max-width:700px){.rf-top{grid-column:span 1}}
`;

const toDate = (v: any): Date | null => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

export default function AdminReferralsPage() {
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [rewards, setRewards] = useState<Map<string, RewardInfo>>(new Map());

  // Har safal referral ka reward (referral_rewards doc id = referral doc id)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'referral_rewards'),
      (snap) => {
        const m = new Map<string, RewardInfo>();
        snap.docs.forEach((d) => {
          const x = d.data();
          m.set(d.id, { status: x.status || '', rewardType: x.chosenReward || x.rewardType || '', validTill: toDate(x.validTill) });
        });
        setRewards(m);
      },
      (err) => console.error('Referral rewards listener error:', err)
    );
    return () => unsub();
  }, []);

  // Live listener: signup par transaction se bana har referral turant yahan dikhta hai
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'referrals'),
      (snap) => {
        setRows(
          snap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              referrerId: x.referrerId || (x.referrerPhone ? `u_${x.referrerPhone}` : ''),
              referrerName: x.referrerName || '',
              referrerPhone: x.referrerPhone || '',
              referredUserName: x.referredUserName || 'पाठक',
              referredUserPhone: x.referredUserPhone || String(x.referredUserId || '').replace(/^u_/, ''),
              status: x.status || '',
              verifiedAutomatically: x.verifiedAutomatically === true,
              // serverTimestamp pending ho toh abhi ka time
              joinedAt: toDate(x.completedAt || x.createdAt) || new Date(),
              codeUsed: x.referralCodeUsed || (x.referrerPhone ? 'फ़ोन लिंक' : '')
            };
          })
        );
        setLoading(false);
        setError('');
      },
      (err) => {
        console.error('Referrals listener error:', err);
        setError('Referrals load nahi ho paaye: ' + err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Sirf safal referrals (naye auto-verified + purane 'successful_signup' records)
  const successful = useMemo(() => rows.filter((r) => r.status === 'completed' || r.status === 'successful_signup'), [rows]);

  const countByReferrer = useMemo(() => {
    const map = new Map<string, number>();
    successful.forEach((r) => map.set(r.referrerPhone, (map.get(r.referrerPhone) || 0) + 1));
    return map;
  }, [successful]);

  const topReferrers = useMemo(() => {
    const names = new Map<string, string>();
    successful.forEach((r) => r.referrerName && names.set(r.referrerPhone, r.referrerName));
    return Array.from(countByReferrer.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phone, count]) => ({ phone, count, name: names.get(phone) || '' }));
  }, [successful, countByReferrer]);

  const autoVerifiedCount = successful.filter((r) => r.verifiedAutomatically).length;
  const rewardOf = (id: string) => rewards.get(id);
  const isEpaperGranted = (rw?: RewardInfo) => !!rw && (rw.status === 'granted' || (rw.status === 'claimed' && rw.rewardType === 'epaper_3_months'));
  const epaperMonthsGranted = successful.filter((r) => isEpaperGranted(rewardOf(r.id))).length * 3;
  const pendingRewardCount = successful.filter((r) => rewardOf(r.id)?.status === 'pending_selection').length;
  const todayKey = new Date().toDateString();
  const todayCount = successful.filter((r) => r.joinedAt?.toDateString() === todayKey).length;

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return successful
      .filter(
        (r) =>
          !q ||
          r.referrerPhone.includes(q) ||
          r.referrerName.toLowerCase().includes(q) ||
          r.referredUserPhone.includes(q) ||
          r.referredUserName.toLowerCase().includes(q) ||
          r.codeUsed.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const diff = (a.joinedAt?.getTime() || 0) - (b.joinedAt?.getTime() || 0);
        return newestFirst ? -diff : diff;
      });
  }, [successful, search, newestFirst]);

  return (
    <div style={{ color: '#fff' }}>
      <style dangerouslySetInnerHTML={{ __html: RF_STYLES }} />

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>🎁 Refer & Earn — Referrals</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Naye user ke OTP signup par referral apne aap verify hota hai (self-referral aur duplicate block) aur referrer ko turant 3 mahine ka free e-paper mil jaata hai — koi manual approval nahi
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.4)', color: '#fca5a5', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', marginBottom: '16px' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="rf-cards">
        <div className="rf-card">
          <div className="rf-card-label">Total Successful Referrals</div>
          <div className="rf-card-value">{successful.length}</div>
        </div>
        <div className="rf-card">
          <div className="rf-card-label">Auto Verified</div>
          <div className="rf-card-value" style={{ color: '#6ee7b7' }}>{autoVerifiedCount}</div>
        </div>
        <div className="rf-card">
          <div className="rf-card-label">Free E-paper Diya (mahine)</div>
          <div className="rf-card-value" style={{ color: '#fbbf24' }}>{epaperMonthsGranted}</div>
        </div>
        <div className="rf-card">
          <div className="rf-card-label">Reward Activate Baaki (purane)</div>
          <div className="rf-card-value" style={{ color: pendingRewardCount ? '#fb923c' : '#fff' }}>{pendingRewardCount}</div>
        </div>
        <div className="rf-card">
          <div className="rf-card-label">Aaj ke Referrals</div>
          <div className="rf-card-value">{todayCount}</div>
        </div>
        <div className="rf-card rf-top">
          <div className="rf-card-label" style={{ marginBottom: '8px' }}>🏆 Top Referrers</div>
          {topReferrers.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#64748b' }}>Abhi koi referral nahi</div>
          ) : (
            topReferrers.map((t, i) => (
              <div key={t.phone} className="rf-top-row">
                <span>
                  <span className="rf-rank">#{i + 1}</span>
                  {t.name || 'पाठक'} <span style={{ color: '#64748b' }}>· {t.phone}</span>
                </span>
                <b>{t.count}</b>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rf-toolbar">
        <input
          className="rf-input"
          placeholder="Referrer / naye user ka naam, phone ya referral code search karein…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="rf-btn" onClick={() => setNewestFirst((v) => !v)}>
          Date: {newestFirst ? 'Newest ↓' : 'Oldest ↑'}
        </button>
      </div>

      <div className="rf-table-wrap">
        {loading ? (
          <div className="rf-empty">Loading…</div>
        ) : visibleRows.length === 0 ? (
          <div className="rf-empty">{search ? 'Is search ke liye koi referral nahi mila' : 'Abhi tak koi referral nahi'}</div>
        ) : (
          <table className="rf-table">
            <thead>
              <tr>
                <th>Referrer</th>
                <th>New Joined User</th>
                <th>Join Date / Time</th>
                <th>Code</th>
                <th>Status</th>
                <th>Referrer ka Reward</th>
                <th>Referrer ke Total Referrals</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.referrerName || 'पाठक'}
                    <span className="rf-sub">{r.referrerPhone}</span>
                  </td>
                  <td>
                    {r.referredUserName}
                    <span className="rf-sub">{r.referredUserPhone}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r.joinedAt
                      ? r.joinedAt.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td style={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', whiteSpace: 'nowrap' }}>{r.codeUsed || '—'}</td>
                  <td>
                    {r.verifiedAutomatically ? (
                      <span className="rf-badge" style={{ background: 'rgba(16,185,129,.15)', color: '#6ee7b7' }}>✓ Auto Verified</span>
                    ) : (
                      <span className="rf-badge" style={{ background: 'rgba(148,163,184,.15)', color: '#cbd5e1' }}>Legacy</span>
                    )}
                  </td>
                  <td>
                    {(() => {
                      const rw = rewardOf(r.id);
                      if (isEpaperGranted(rw))
                        return (
                          <>
                            <span className="rf-badge" style={{ background: 'rgba(251,191,36,.15)', color: '#fcd34d' }}>📰 3 माह E-paper</span>
                            {rw?.validTill && (
                              <span className="rf-sub">
                                {rw.validTill.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} tak
                              </span>
                            )}
                          </>
                        );
                      if (rw?.status === 'claimed')
                        return <span className="rf-badge" style={{ background: 'rgba(96,165,250,.15)', color: '#93c5fd' }}>VIP (purana)</span>;
                      if (rw?.status === 'pending_selection')
                        return <span className="rf-badge" style={{ background: 'rgba(251,146,60,.15)', color: '#fdba74' }}>Activate baaki</span>;
                      return <span className="rf-sub">—</span>;
                    })()}
                  </td>
                  <td style={{ fontWeight: 700 }}>{countByReferrer.get(r.referrerPhone) || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
