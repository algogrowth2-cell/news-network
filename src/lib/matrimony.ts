/*
 * Matrimony (विवाह) — saare portals par.
 *  - Bio-data sirf yahi tay fields (dusri cheez nahi); login ke bina na daal sakte, na dekh sakte.
 *  - Number KABHI profile me nahi jaata (alag server-only jagah). "Ruchi" bhej kar, owner/admin accept kare
 *    tabhi dono ko contact milta hai — isliye koi number chura kar pareshan nahi kar sakta.
 *  - Nayi/badli profile hamesha 'pending' → admin approve kare tabhi website par dikhti hai.
 *  - Sab kuch admin panel se juda: admin har profile, contact aur ruchi dekh/badal sakta hai.
 *
 * Firestore (sab server/admin likhte hain — client seedhe nahi):
 *   matrimony_profiles/{id}   public bio-data (NO number)       client: sirf approved padhe (login par)
 *   matrimony_contacts/{id}   { ownerPhone }                    sirf server/admin
 *   matrimony_index/{phone}   { profileId }                     sirf server (ek number = ek profile)
 *   matrimony_interests/{id}  { fromPhone, toProfileId, status} sirf server/admin
 */

export type Gender = 'male' | 'female';
export type ProfileStatus = 'pending' | 'approved' | 'rejected' | 'paused';
export type InterestStatus = 'pending' | 'accepted' | 'declined';

export interface MatrimonyProfile {
  id: string;
  name: string;
  gender: Gender;
  dob: string; // YYYY-MM-DD
  heightCm: number;
  maritalStatus: string;
  religion: string;
  community: string; // jaati / samुदाय (ab zaroori)
  castePreference: string; // apni hi jaati me / koi bhi jaati chalegi
  motherTongue: string;
  city: string;
  state: string;
  education: string;
  employmentType: string; // naukri / business / student… (dropdown, zaroori)
  workField: string; // kis kshetra me (dropdown, optional)
  companyName: string; // company / sanstha ka naam (optional)
  designation: string; // padnaam (optional)
  occupation: string; // purana/short (optional — ab structured fields se)
  annualIncome: string; // range label (optional)
  diet: string; // optional
  fatherName: string;
  motherName: string;
  grandfatherName: string; // dadaji (optional)
  brothers: string; // kitne bhai (dropdown)
  sisters: string; // kitni bahan (dropdown)
  landBigha: string; // parivaar ki kृषि bhumi — bigha me (optional, kisan parivaar ke liye)
  about: string;
  family: string; // anya parivaar jaankari (optional)
  partnerPreference: string; // kaisa jeevansaathi chahiye (short)
  postedBy: string; // rishta kisne daala — swayं / papa / mummy / mama / fufa...
  photoUrl: string; // pehli photo (card/thumbnail)
  photos: string[]; // 1 se 5 photo
  siteId: string;
  status: ProfileStatus;
}

/* ---------- tay options (dropdown) — inhi me se chunना hai ---------- */
export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'पुरुष (वर)' },
  { value: 'female', label: 'महिला (वधू)' }
];
export const MARITAL_STATUS = ['अविवाहित', 'तलाकशुदा', 'विधुर / विधवा', 'अलग रह रहे'];
export const RELIGIONS = ['हिंदू', 'मुस्लिम', 'सिख', 'ईसाई', 'जैन', 'बौद्ध', 'पारसी', 'यहूदी', 'अन्य'];
// Jeevansaathi ki jaati ko lekar soch
export const CASTE_PREFERENCES = ['अपनी ही जाति / समुदाय में', 'कोई भी जाति / समुदाय चलेगा (अंतरजातीय स्वीकार्य)'];
export const MOTHER_TONGUES = ['हिंदी', 'मराठी', 'गुजराती', 'पंजाबी', 'राजस्थानी', 'मालवी', 'निमाड़ी', 'उर्दू', 'बंगाली', 'तमिल', 'तेलुगु', 'मलयालम', 'कन्नड़', 'अंग्रेज़ी', 'अन्य'];
export const DIETS = ['शाकाहारी', 'मांसाहारी', 'अंडाहारी', 'जैन शाकाहारी'];
export const SIBLING_COUNTS = ['0', '1', '2', '3', '4', '5', '6', '7', '8 से अधिक'];
// Rishta kisne daala (profile kisne banayी)
export const POSTED_BY_OPTIONS = ['स्वयं', 'पिता', 'माता', 'भाई', 'बहन', 'मामा', 'मामी', 'फूफा', 'बुआ', 'चाचा', 'ताऊ', 'अन्य संबंधी'];
export const MAX_PHOTOS = 5;
// Kaam / rozgaar
export const EMPLOYMENT_TYPES = ['निजी नौकरी (Private Job)', 'सरकारी नौकरी (Govt Job)', 'व्यवसाय / बिज़नेस', 'स्वरोज़गार / फ्रीलांस', 'खेती / किसान', 'छात्र (पढ़ाई जारी)', 'गृहिणी', 'वर्तमान में कार्यरत नहीं'];
export const WORK_FIELDS = ['आईटी / सॉफ्टवेयर', 'इंजीनियरिंग', 'चिकित्सा / स्वास्थ्य', 'शिक्षा / अध्यापन', 'बैंकिंग / वित्त', 'सरकारी / प्रशासनिक', 'रक्षा / पुलिस / सेना', 'व्यापार / रिटेल', 'कृषि', 'कानून', 'मीडिया / पत्रकारिता', 'कला / डिज़ाइन', 'मार्केटिंग / सेल्स', 'अन्य'];
// Pद / भूमिका — dropdown suggestion + khud bhi likh sakte hain (datalist)
export const ROLE_OPTIONS = [
  'सॉफ्टवेयर इंजीनियर', 'एयरोस्पेस इंजीनियर', 'सिविल इंजीनियर', 'मैकेनिकल इंजीनियर', 'इलेक्ट्रिकल इंजीनियर',
  'डॉक्टर', 'डेंटिस्ट', 'नर्स', 'फार्मासिस्ट', 'शिक्षक / प्रोफेसर', 'अकाउंटेंट / CA', 'बैंक अधिकारी',
  'मार्केटिंग मैनेजर', 'सेल्स एग्जीक्यूटिव', 'डिजिटल मार्केटिंग', 'ग्राफिक डिज़ाइनर', 'UI/UX डिज़ाइनर',
  'फैशन डिज़ाइनर', 'आर्किटेक्ट', 'वकील', 'IAS / IPS अधिकारी', 'सरकारी कर्मचारी', 'पुलिस / सेना अधिकारी',
  'डेटा एनालिस्ट', 'डेटा साइंटिस्ट', 'प्रोजेक्ट मैनेजर', 'HR मैनेजर', 'कंटेंट राइटर', 'पत्रकार', 'फोटोग्राफर',
  'व्यापारी / दुकानदार', 'रियल एस्टेट', 'किसान', 'शेफ / कुक', 'इलेक्ट्रीशियन', 'अन्य'
];
// Jaldi bharne ke liye sujhav (click karke add + khud bhi likh sakte hain)
export const ABOUT_SUGGESTIONS = [
  'सरल और मिलनसार स्वभाव', 'संस्कारी परिवार से', 'धार्मिक विचारधारा', 'पढ़ा-लिखा परिवार', 'घरेलू स्वभाव',
  'मेहनती व जिम्मेदार', 'शाकाहारी परिवार', 'खेलकूद में रुचि', 'समाज सेवा में रुचि', 'शांत स्वभाव', 'महत्वाकांक्षी'
];
export const PARTNER_SUGGESTIONS = [
  'सुशील व संस्कारी', 'पढ़ी-लिखी', 'नौकरीपेशा', 'घरेलू', 'सरकारी नौकरी वाला/वाली', 'अच्छे परिवार से',
  'समान विचारधारा', 'शाकाहारी', 'समझदार व जिम्मेदार', 'परिवार का सम्मान करने वाला/वाली', 'धार्मिक'
];
// Jinme company/designation poochhna theek (student/grihini/berozgar me nahi)
export const WORKS_FOR_PAY = (t: string) => !!t && !['छात्र (पढ़ाई जारी)', 'गृहिणी', 'वर्तमान में कार्यरत नहीं'].includes(t);
// Card/list ke liye ek saaf career line
export function careerLine(p: { designation?: string; companyName?: string; occupation?: string; workField?: string; employmentType?: string }): string {
  const parts = [p.designation, p.companyName].filter(Boolean) as string[];
  if (parts.length) return parts.join(', ');
  if (p.occupation) return p.occupation;
  if (p.workField && WORKS_FOR_PAY(p.employmentType || '')) return p.workField;
  return p.employmentType || '';
}
export const INCOME_RANGES = ['कोई आय नहीं', '₹1 लाख से कम', '₹1–3 लाख', '₹3–5 लाख', '₹5–10 लाख', '₹10–20 लाख', '₹20 लाख से अधिक', 'बताना नहीं चाहते'];

/* ---------- Height: cm ⇄ feet/inch ---------- */
export const HEIGHT_OPTIONS = (() => {
  const list: { cm: number; label: string }[] = [];
  for (let totalIn = 48; totalIn <= 84; totalIn++) {
    const ft = Math.floor(totalIn / 12);
    const inch = totalIn % 12;
    list.push({ cm: Math.round(totalIn * 2.54), label: `${ft}'${inch}" (${Math.round(totalIn * 2.54)} सेमी)` });
  }
  return list;
})();
export const heightLabel = (cm: number) => {
  if (!cm) return '';
  const found = HEIGHT_OPTIONS.find((h) => h.cm === cm);
  if (found) return found.label.split(' ')[0];
  const totalIn = Math.round(cm / 2.54);
  return `${Math.floor(totalIn / 12)}'${totalIn % 12}"`;
};

export const ageFromDob = (dob: string): number => {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};

export const STATUS_LABEL: Record<ProfileStatus, string> = {
  pending: 'समीक्षा में (Pending)',
  approved: 'स्वीकृत (Live)',
  rejected: 'अस्वीकृत',
  paused: 'रोकी गई'
};

/* ---------- Validation (server authoritative) ----------
 * Saaf + seema; galat enum/khali zaroori field par { ok:false, error }.
 */
const str = (v: any, max: number) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);
const MIN_AGE = 18;
const MAX_AGE = 90;

export interface CleanResult {
  ok: boolean;
  error?: string;
  data?: Omit<MatrimonyProfile, 'id' | 'status'>;
}

export function cleanProfileInput(input: any): CleanResult {
  const name = str(input.name, 60);
  if (name.length < 2) return { ok: false, error: 'कृपया पूरा नाम दर्ज करें।' };

  const gender = input.gender === 'male' || input.gender === 'female' ? (input.gender as Gender) : null;
  if (!gender) return { ok: false, error: 'कृपया पुरुष/महिला चुनें।' };

  const dob = str(input.dob, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return { ok: false, error: 'कृपया जन्मतिथि चुनें।' };
  const age = ageFromDob(dob);
  if (age < MIN_AGE) return { ok: false, error: 'विवाह प्रोफ़ाइल के लिए आयु कम से कम 18 वर्ष होनी चाहिए।' };
  if (age > MAX_AGE) return { ok: false, error: 'कृपया सही जन्मतिथि दर्ज करें।' };

  const heightCm = Math.round(Number(input.heightCm) || 0);
  if (heightCm < 120 || heightCm > 220) return { ok: false, error: 'कृपया सही लंबाई चुनें।' };

  const pick = (v: any, list: string[], label: string) => (list.includes(String(v)) ? String(v) : (list.length && v === undefined ? '' : null));
  const maritalStatus = MARITAL_STATUS.includes(String(input.maritalStatus)) ? String(input.maritalStatus) : null;
  if (!maritalStatus) return { ok: false, error: 'कृपया वैवाहिक स्थिति चुनें।' };
  const religion = RELIGIONS.includes(String(input.religion)) ? String(input.religion) : null;
  if (!religion) return { ok: false, error: 'कृपया धर्म चुनें।' };
  const motherTongue = MOTHER_TONGUES.includes(String(input.motherTongue)) ? String(input.motherTongue) : null;
  if (!motherTongue) return { ok: false, error: 'कृपया मातृभाषा चुनें।' };
  const community = str(input.community, 50);
  if (community.length < 2) return { ok: false, error: 'कृपया जाति / समुदाय दर्ज करें।' };
  const castePreference = CASTE_PREFERENCES.includes(String(input.castePreference)) ? String(input.castePreference) : null;
  if (!castePreference) return { ok: false, error: 'कृपया चुनें — अपनी जाति में या कोई भी जाति स्वीकार्य।' };

  const city = str(input.city, 40);
  const state = str(input.state, 40);
  if (city.length < 2 || state.length < 2) return { ok: false, error: 'कृपया शहर और राज्य दर्ज करें।' };

  const education = str(input.education, 80);
  if (education.length < 2) return { ok: false, error: 'कृपया शिक्षा दर्ज करें।' };

  // Kaam / rozgaar — type zaroori; baaki (kshetra/company/padnaam) jab kaam karte hon
  const employmentType = EMPLOYMENT_TYPES.includes(String(input.employmentType)) ? String(input.employmentType) : null;
  if (!employmentType) return { ok: false, error: 'कृपया चुनें कि आप नौकरी/व्यवसाय करते हैं या नहीं।' };
  const workField = WORK_FIELDS.includes(String(input.workField)) ? String(input.workField) : '';
  const companyName = str(input.companyName, 80);
  const designation = str(input.designation, 80);
  const occupation = str(input.occupation, 80);

  // Parivaar — papa/mummy ka naam zaroori, dadaji vaikalpik, bhai/bahan dropdown
  const fatherName = str(input.fatherName, 60);
  if (fatherName.length < 2) return { ok: false, error: 'कृपया पिता का नाम दर्ज करें।' };
  const motherName = str(input.motherName, 60);
  if (motherName.length < 2) return { ok: false, error: 'कृपया माता का नाम दर्ज करें।' };
  const grandfatherName = str(input.grandfatherName, 60);
  const sib = (v: any) => (SIBLING_COUNTS.includes(String(v)) ? String(v) : '0');
  const brothers = sib(input.brothers);
  const sisters = sib(input.sisters);
  const landBigha = str(input.landBigha, 30); // kृषि bhumi (optional)

  // Optional, par ho to valid
  const diet = DIETS.includes(String(input.diet)) ? String(input.diet) : '';
  const annualIncome = INCOME_RANGES.includes(String(input.annualIncome)) ? String(input.annualIncome) : '';
  const about = str(input.about, 600);
  const family = str(input.family, 400);
  const partnerPreference = str(input.partnerPreference, 400);

  const postedBy = POSTED_BY_OPTIONS.includes(String(input.postedBy)) ? String(input.postedBy) : 'स्वयं';

  // Photos: 1 se MAX_PHOTOS. Har ek https ya chhoti data:image; kul milakar Firestore 1MB seema me
  const cleanPhoto = (raw: any): string => {
    const s = String(raw || '').trim();
    if (/^https:\/\/[^\s"'<>]{4,2000}$/i.test(s)) return s;
    if (/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length <= 300_000) return s;
    return '';
  };
  const rawList = Array.isArray(input.photos) && input.photos.length ? input.photos : [input.photoUrl];
  const photos = rawList.map(cleanPhoto).filter(Boolean).slice(0, MAX_PHOTOS);
  if (!photos.length) return { ok: false, error: 'कृपया कम से कम 1 फोटो जोड़ें।' };
  if (photos.reduce((n: number, p: string) => n + p.length, 0) > 950_000) return { ok: false, error: 'फोटो का कुल आकार बहुत बड़ा है, कृपया कम या छोटी फोटो चुनें।' };
  const photoUrl = photos[0];

  const siteId = str(input.siteId, 60) || 'the-local-leader';

  return {
    ok: true,
    data: {
      name, gender, dob, heightCm, maritalStatus, religion, community, castePreference, motherTongue,
      city, state, education, employmentType, workField, companyName, designation, occupation, annualIncome, diet,
      fatherName, motherName, grandfatherName, brothers, sisters, landBigha,
      about, family, partnerPreference, postedBy, photoUrl, photos, siteId
    }
  };
}
