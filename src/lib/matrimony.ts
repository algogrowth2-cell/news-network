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
  occupation: string;
  annualIncome: string; // range label (optional)
  diet: string; // optional
  about: string;
  family: string; // parivaar (short)
  partnerPreference: string; // kaisa jeevansaathi chahiye (short)
  photoUrl: string; // optional
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
  const occupation = str(input.occupation, 80);
  if (occupation.length < 2) return { ok: false, error: 'कृपया व्यवसाय दर्ज करें।' };

  // Optional, par ho to valid
  const diet = DIETS.includes(String(input.diet)) ? String(input.diet) : '';
  const annualIncome = INCOME_RANGES.includes(String(input.annualIncome)) ? String(input.annualIncome) : '';
  const about = str(input.about, 600);
  const family = str(input.family, 400);
  const partnerPreference = str(input.partnerPreference, 400);

  // Photo: https link ya chhoti data:image (Firestore 1MB seema me)
  const rawPhoto = String(input.photoUrl || '').trim();
  let photoUrl = '';
  if (/^https:\/\/[^\s"'<>]{4,2000}$/i.test(rawPhoto)) photoUrl = rawPhoto;
  else if (/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(rawPhoto) && rawPhoto.length <= 900_000) photoUrl = rawPhoto;

  const siteId = str(input.siteId, 60) || 'the-local-leader';

  return {
    ok: true,
    data: {
      name, gender, dob, heightCm, maritalStatus, religion, community, castePreference, motherTongue,
      city, state, education, occupation, annualIncome, diet, about, family, partnerPreference, photoUrl, siteId
    }
  };
}
