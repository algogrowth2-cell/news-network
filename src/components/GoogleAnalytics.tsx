'use client';

import Script from 'next/script';

// Google Analytics (GA4) — poori site par visitors/journey tracking.
// ID public hoti hai (client JS me jaati hai), isliye yahin safe hai.
// Vercel me NEXT_PUBLIC_GA_ID set ho to wahi, warna ye default.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-RW0E9ZN1BK';

export default function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
