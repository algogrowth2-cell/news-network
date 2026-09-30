// Rashifal ke liye shared data: auto-sync API route aur homepage widget dono yahi use karte hain

export const RASHI_LIST = [
  { id: 'aries', name: 'मेष', nameEn: 'Aries', sign: '♈' },
  { id: 'taurus', name: 'वृषभ', nameEn: 'Taurus', sign: '♉' },
  { id: 'gemini', name: 'मिथुन', nameEn: 'Gemini', sign: '♊' },
  { id: 'cancer', name: 'कर्क', nameEn: 'Cancer', sign: '♋' },
  { id: 'leo', name: 'सिंह', nameEn: 'Leo', sign: '♌' },
  { id: 'virgo', name: 'कन्या', nameEn: 'Virgo', sign: '♍' },
  { id: 'libra', name: 'तुला', nameEn: 'Libra', sign: '♎' },
  { id: 'scorpio', name: 'वृश्चिक', nameEn: 'Scorpio', sign: '♏' },
  { id: 'sagittarius', name: 'धनु', nameEn: 'Sagittarius', sign: '♐' },
  { id: 'capricorn', name: 'मकर', nameEn: 'Capricorn', sign: '♑' },
  { id: 'aquarius', name: 'कुंभ', nameEn: 'Aquarius', sign: '♒' },
  { id: 'pisces', name: 'मीन', nameEn: 'Pisces', sign: '♓' }
];

// Aaj ki date India time (Asia/Kolkata) me, YYYY-MM-DD — server UTC me chale tab bhi sahi din
export const todayIST = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

// Kya Firestore ke saare 12 rashi docs aaj ki date ke hain?
export const isRashifalFresh = (docsById: Record<string, any>, today = todayIST()) =>
  RASHI_LIST.every((r) => docsById[r.id]?.date === today && docsById[r.id]?.prediction);
