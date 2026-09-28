'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface ReferralReward {
  id: string;
  referrerPhone: string;
  referredUserPhone: string;
  status: 'pending_selection' | 'claimed';
  chosenReward?: 'epaper_3_months' | 'all_portals_3_months';
  createdAt: any;
}

interface Props {
  userPhone: string;
  userEmail?: string;
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
}

export default function ReferralRewardsModal({
  userPhone,
  userEmail,
  isOpen,
  onClose,
  primaryColor = '#ea580c'
}: Props) {
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralLink =
    typeof window !== 'undefined' ? `${window.location.origin}/login?ref=${userPhone}` : '';

  useEffect(() => {
    if (!userPhone) return;

    const q = query(
      collection(db, 'referral_rewards'),
      where('referrerPhone', '==', userPhone)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ReferralReward[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ReferralReward));
      setRewards(list);
    });

    return () => unsub();
  }, [userPhone]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClaimReward = async (
    rewardId: string,
    choice: 'epaper_3_months' | 'all_portals_3_months'
  ) => {
    if (!userPhone) return;
    setLoading(true);

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months (90 days)

      // 1. Agar e-paper choose kiya toh epaper_subscriptions me active karo
      if (choice === 'epaper_3_months' && userEmail) {
        await setDoc(
          doc(db, 'epaper_subscriptions', userEmail),
          {
            userEmail: userEmail,
            userPhone: userPhone,
            planName: 'रेफरल रिवार्ड (3 माह फ्री ई-पेपर)',
            status: 'active',
            startedAt: serverTimestamp(),
            expiresAt: expiresAt,
            isReferralReward: true
          },
          { merge: true }
        );
      }

      // 2. Agar all portals choose kiya toh user document ko VIP banayein
      if (choice === 'all_portals_3_months') {
        await setDoc(
          doc(db, 'vip_all_access', userPhone),
          {
            userPhone: userPhone,
            userEmail: userEmail || '',
            planName: 'रेफरल रिवार्ड (3 माह सभी पोर्टल्स फ्री)',
            status: 'active',
            startedAt: serverTimestamp(),
            expiresAt: expiresAt,
            allPortalsUnlocked: true
          },
          { merge: true }
        );
      }

      // 3. Referral reward status update karo
      await updateDoc(doc(db, 'referral_rewards', rewardId), {
        status: 'claimed',
        chosenReward: choice,
        claimedAt: serverTimestamp(),
        validTill: expiresAt
      });

      alert('🎉 बधाई! आपका 3 महीने का फ्री ऐक्सेस सफलतापूर्वक एक्टिवेट हो गया है।');
    } catch (e: any) {
      console.error(e);
      alert('रिवार्ड एक्टिवेट करने में त्रुटि: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const pendingRewards = rewards.filter((r) => r.status === 'pending_selection');

  const optionStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '1.5px solid #cbd5e1',
    padding: '10px',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    width: '100%',
    fontFamily: 'inherit'
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          maxWidth: '460px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: primaryColor,
            color: '#fff',
            padding: '18px 20px',
            borderRadius: '16px 16px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>🎁 रेफर करें और 3 माह फ्री पाएं</h3>
            <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.9 }}>
              दोस्तों को रेफर करें और हर सफल साइन-अप पर उपहार चुनें।
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="बंद करें"
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '14px',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Share Link Section */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              आपका यूनिक रेफरल लिंक:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={referralLink}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '9px 10px',
                  fontSize: '12.5px',
                  color: '#475569',
                  backgroundColor: '#f8fafc'
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  backgroundColor: copied ? '#16a34a' : primaryColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied ? '✓ कॉपीड' : 'कॉपी करें'}
              </button>
            </div>
          </div>

          {/* Pending Rewards Choice */}
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              उपलब्ध रिवार्ड्स ({pendingRewards.length})
            </h4>

            {pendingRewards.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '16px',
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: 1.6,
                  textAlign: 'center'
                }}
              >
                अभी कोई अनक्लेम्ड रिवार्ड नहीं है। अपने लिंक को शेयर करें, जब कोई नया पाठक जुड़ेगा तो आपको 3 महीने का फ्री ऐक्सेस मिलेगा!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pendingRewards.map((reward) => (
                  <div
                    key={reward.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', marginBottom: '6px' }}>
                      ✓ सफल रेफरल: {reward.referredUserPhone}
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#334155' }}>
                      अपना पसंदीदा 3 महीने का मुफ़्त उपहार चुनें:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        disabled={loading}
                        onClick={() => handleClaimReward(reward.id, 'epaper_3_months')}
                        style={optionStyle}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 700, color: primaryColor }}>
                          ऑप्शन 1: 3 महीने फ्री ई-पेपर
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                          बिना किसी शुल्क के 90 दिनों तक सभी संस्करणों का ई-पेपर पढ़ें।
                        </div>
                      </button>

                      <button
                        disabled={loading}
                        onClick={() => handleClaimReward(reward.id, 'all_portals_3_months')}
                        style={optionStyle}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 700, color: primaryColor }}>
                          ऑप्शन 2: 3 महीने सभी पोर्टल्स फ्री (VIP)
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                          नेटवर्क के सभी न्यूज़ पोर्टल्स का संपूर्ण ऐक्सेस 90 दिनों तक फ्री।
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}