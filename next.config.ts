import type { NextConfig } from "next";

// Browser suraksha headers (sab pages par). CSP jaan-boojhkar halki rakhi hai — ads, Razorpay,
// Google Translate, YouTube, Drive media sab bahar ke domain se aate hain; sirf framing/plugin/base rokta hai.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // AWS S3 (Mumbai) ki images next/image se optimize ho sakें
    remotePatterns: [
      { protocol: 'https', hostname: 'goldenpearl-media.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' }
    ]
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
} as any;

export default nextConfig;
