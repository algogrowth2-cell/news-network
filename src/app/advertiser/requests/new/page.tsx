'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/* Naya vigyapan ab dashboard se hi — pehle Razorpay bhugtan, phir admin manzoori (purana bina-bhugtan form band) */
export default function NewAdRequest() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/advertiser/dashboard');
  }, [router]);
  return <p style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#64748b' }}>डैशबोर्ड पर ले जा रहे हैं...</p>;
}
