/*
 * जनता दरबार / पत्रकार / विज्ञापन — in 3 pages ka content admin se badalta hai (settings/page_*).
 * Doc na ho toh niche wale default chalte hain (kuch tute nahi, code badalne ki zaroorat nahi).
 * Server component REST se padhta hai (settings public-readable), client hook getDoc se.
 */
const BASE = 'https://firestore.googleapis.com/v1/projects/newsadmin-network/databases/(default)/documents';

export type PageKey = 'janta' | 'patrakar' | 'advertiser';
export const PAGE_DOC: Record<PageKey, string> = { janta: 'page_janta', patrakar: 'page_patrakar', advertiser: 'page_advertiser' };

export interface Benefit { icon: string; h: string; p: string }
export interface Step { h: string; p: string }

export interface IntroContent {
  badge: string;
  title: string;
  subtitle: string;
  trust: string[];
  benefitsHeading: string;
  benefits: Benefit[];
  ctaTitle: string;
  ctaText: string;
}

export interface JantaContent {
  badge: string;
  title: string;
  subtitle: string;
  aboutTitle: string;
  aboutText: string;
  steps: Step[];
  loginTitle: string;
  loginText: string;
}

export type PageContent<K extends PageKey> = K extends 'janta' ? JantaContent : IntroContent;

export const DEFAULT_PATRAKAR: IntroContent = {
  badge: '✍️ पत्रकार पोर्टल',
  title: 'हमारे पत्रकार बनें',
  subtitle: 'क्या आप अपने इलाके की सच्ची खबरें लोगों तक पहुँचाना चाहते हैं? हमारे न्यूज़ नेटवर्क से जुड़िए और एक सत्यापित पत्रकार के रूप में अपनी पहचान बनाइए। नीचे जानिए आपको क्या-क्या मिलेगा।',
  trust: ['🪪 सत्यापित प्रेस ID', '🌐 8 पोर्टल नेटवर्क', '⚡ मिनटों में रजिस्ट्रेशन', '✅ फ्री जुड़ें'],
  benefitsHeading: 'आपको क्या-क्या मिलेगा',
  benefits: [
    { icon: '🪪', h: 'डिजिटल प्रेस पहचान पत्र', p: 'सत्यापन के बाद आपको आधिकारिक डिजिटल प्रेस ID कार्ड मिलता है — अपने नाम और फोटो के साथ।' },
    { icon: '📝', h: 'अपनी खबरें प्रकाशित करें', p: 'अपने इलाके की खबरें सीधे पोर्टल पर भेजें। संपादकीय समीक्षा के बाद वे वेबसाइट पर लाइव होती हैं।' },
    { icon: '🌐', h: '8 पोर्टल का नेटवर्क', p: 'हमारे पूरे न्यूज़ नेटवर्क में आपकी खबरों को पहुँच और पहचान मिलती है।' },
    { icon: '📊', h: 'अपना डैशबोर्ड', p: 'आपकी भेजी खबरें, उनकी स्थिति (समीक्षा/प्रकाशित) और व्यूज़ — सब एक जगह।' },
    { icon: '📸', h: 'फोटो व वीडियो', p: 'अपनी रिपोर्ट के साथ फोटो और वीडियो जोड़ें — खबर को और भरोसेमंद बनाएं।' },
    { icon: '🤝', h: 'पहचान और सम्मान', p: 'हर प्रकाशित खबर आपके नाम के साथ जाती है — एक पत्रकार के रूप में अपनी पहचान बनाएं।' }
  ],
  ctaTitle: 'आज ही जुड़ें',
  ctaText: 'पहले से खाता है तो लॉगिन करें, या नया पत्रकार खाता बनाएं। (मोबाइल OTP से सुरक्षित सत्यापन)'
};

export const DEFAULT_ADVERTISER: IntroContent = {
  badge: '📢 विज्ञापन पोर्टल',
  title: 'अपना व्यापार हमारे साथ बढ़ाएं',
  subtitle: 'हमारे न्यूज़ नेटवर्क पर रोज़ हज़ारों लोग खबरें पढ़ते हैं। अपने व्यापार, दुकान या सेवा का विज्ञापन यहाँ देकर सीधे उन तक पहुँचें। नीचे जानिए विज्ञापन देने से आपको क्या-क्या फ़ायदा होगा।',
  trust: ['📈 ज़्यादा ग्राहक', '🎯 टार्गेटेड पहुँच', '💰 हर बजट के प्लान', '📊 लाइव रिपोर्ट'],
  benefitsHeading: 'विज्ञापन देने के फ़ायदे',
  benefits: [
    { icon: '📈', h: 'व्यापार तेज़ी से बढ़ाएं', p: 'हज़ारों पाठकों तक सीधे पहुँचें और अपने ग्राहक बढ़ाएं — स्थानीय से लेकर पूरे राज्य तक।' },
    { icon: '🎯', h: 'सही लोगों तक मार्केटिंग', p: 'अपने शहर/राज्य और श्रेणी के अनुसार विज्ञापन दिखाएं — जहाँ आपके ग्राहक हैं वहीं पहुँचें।' },
    { icon: '🌐', h: '8 न्यूज़ पोर्टल का नेटवर्क', p: 'एक ही जगह से हमारे पूरे नेटवर्क पर विज्ञापन — ज़्यादा लोग, ज़्यादा पहचान।' },
    { icon: '💰', h: 'किफ़ायती और लचीले प्लान', p: 'छोटे दुकानदार से बड़े ब्रांड तक — हर बजट के लिए विकल्प। आप तय करें कहाँ और कितना।' },
    { icon: '📊', h: 'लाइव रिपोर्ट', p: 'आपका विज्ञापन कितनी बार दिखा और कितने लोगों ने क्लिक किया — सब अपने डैशबोर्ड में देखें।' },
    { icon: '🏷️', h: 'ब्रांड की पहचान', p: 'लगातार दिखने से लोगों के मन में आपके ब्रांड का भरोसा और पहचान बनती है।' }
  ],
  ctaTitle: 'अभी शुरू करें',
  ctaText: 'पहले से खाता है तो लॉगिन करें, या नया विज्ञापनदाता खाता बनाएं। (मोबाइल OTP से सुरक्षित)'
};

export const DEFAULT_JANTA: JantaContent = {
  badge: '📣 जनता दरबार',
  title: 'आपके आस-पास की खबर, अब आपकी ज़ुबानी',
  subtitle: 'आपने कुछ देखा — कोई घटना, समस्या, या कोई अच्छी खबर? सीधे हमें भेजिए। फोटो और वीडियो के साथ। हमारी टीम सत्यापित करके उसे वेबसाइट पर प्रकाशित करेगी।',
  aboutTitle: 'जनता दरबार क्या है?',
  aboutText: 'जनता दरबार एक नागरिक पत्रकारिता मंच है। यहाँ कोई भी आम नागरिक अपने इलाके की खबर, घटना या समस्या — फोटो और वीडियो के साथ — सीधे हमारे पास भेज सकता है। हमारी संपादकीय टीम हर खबर की जाँच करती है, और सही पाए जाने पर उसे वेबसाइट पर आपके नाम के साथ प्रकाशित किया जाता है।',
  steps: [
    { h: 'खबर लिखें', p: 'क्या, कहाँ और कब हुआ — संक्षेप में बताएं।' },
    { h: 'फोटो/वीडियो', p: 'अपने फ़ोन से सीधे फोटो या वीडियो जोड़ें।' },
    { h: 'प्रकाशन', p: 'टीम सत्यापन के बाद खबर लाइव कर देगी।' }
  ],
  loginTitle: 'खबर भेजने के लिए लॉगिन करें',
  loginText: 'सुरक्षा और भरोसे के लिए खबर सिर्फ़ लॉगिन किए हुए उपयोगकर्ता ही भेज सकते हैं। एक मिनट में मोबाइल OTP से लॉगिन/साइनअप करें।'
};

// ---------- helpers ----------
const s = (v: any, def: string, max = 2000) => {
  const t = String(v ?? '').trim();
  return t ? t.slice(0, max) : def;
};
const arrStr = (v: any, def: string[], max = 10) =>
  Array.isArray(v) && v.length ? v.map((x) => String(x || '').trim()).filter(Boolean).slice(0, max) : def;

const benefits = (v: any, def: Benefit[]) =>
  Array.isArray(v) && v.length
    ? v.map((b: any) => ({ icon: s(b?.icon, '•', 8), h: s(b?.h, '', 120), p: s(b?.p, '', 600) })).filter((b) => b.h || b.p).slice(0, 12)
    : def;

const steps = (v: any, def: Step[]) =>
  Array.isArray(v) && v.length ? v.map((b: any) => ({ h: s(b?.h, '', 80), p: s(b?.p, '', 300) })).filter((b) => b.h || b.p).slice(0, 6) : def;

export function normalizeIntro(raw: any, def: IntroContent): IntroContent {
  return {
    badge: s(raw?.badge, def.badge, 60),
    title: s(raw?.title, def.title, 120),
    subtitle: s(raw?.subtitle, def.subtitle, 600),
    trust: arrStr(raw?.trust, def.trust),
    benefitsHeading: s(raw?.benefitsHeading, def.benefitsHeading, 80),
    benefits: benefits(raw?.benefits, def.benefits),
    ctaTitle: s(raw?.ctaTitle, def.ctaTitle, 80),
    ctaText: s(raw?.ctaText, def.ctaText, 300)
  };
}

export function normalizeJanta(raw: any): JantaContent {
  const d = DEFAULT_JANTA;
  return {
    badge: s(raw?.badge, d.badge, 60),
    title: s(raw?.title, d.title, 120),
    subtitle: s(raw?.subtitle, d.subtitle, 600),
    aboutTitle: s(raw?.aboutTitle, d.aboutTitle, 80),
    aboutText: s(raw?.aboutText, d.aboutText, 1200),
    steps: steps(raw?.steps, d.steps),
    loginTitle: s(raw?.loginTitle, d.loginTitle, 80),
    loginText: s(raw?.loginText, d.loginText, 400)
  };
}

export const DEFAULT_FOR: Record<PageKey, any> = { patrakar: DEFAULT_PATRAKAR, advertiser: DEFAULT_ADVERTISER, janta: DEFAULT_JANTA };

export function normalizeFor(key: PageKey, raw: any): any {
  if (key === 'janta') return normalizeJanta(raw);
  return normalizeIntro(raw, key === 'patrakar' ? DEFAULT_PATRAKAR : DEFAULT_ADVERTISER);
}

// ---------- Firestore REST decode (server) ----------
function dec(v: any): any {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(dec);
  if ('mapValue' in v) return decFields(v.mapValue?.fields || {});
  return null;
}
function decFields(f: any): Record<string, any> {
  const o: Record<string, any> = {};
  for (const k of Object.keys(f || {})) o[k] = dec(f[k]);
  return o;
}

/** SERVER: admin ka tay kiya content (REST, public, ~60s cache). */
export async function getPageContent(key: PageKey): Promise<any> {
  try {
    const r = await fetch(`${BASE}/settings/${PAGE_DOC[key]}`, { next: { revalidate: 60 } });
    if (!r.ok) return DEFAULT_FOR[key];
    const j = await r.json();
    return normalizeFor(key, j.fields ? decFields(j.fields) : {});
  } catch {
    return DEFAULT_FOR[key];
  }
}
