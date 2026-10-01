// Signup/login form validation (reader, patrakar, advertiser sab jagah same niyam)

// username@domain.extension — local part dot se shuru/khatam nahi, '..' nahi, domain me kam se kam ek '.', extension 2+ akshar
const EMAIL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

export const isValidEmail = (value: string) => {
  const email = value.trim();
  return email.length <= 254 && !email.includes('..') && EMAIL_RE.test(email);
};

// Indian mobile: 10 ank, 6-9 se shuru
export const isValidIndianMobile = (value: string) => /^[6-9][0-9]{9}$/.test(value);

// Naam: Hindi/English akshar, space aur . ' - ; 2 se 60 akshar
export const sanitizeName = (value: string) => value.replace(/[<>{}[\]\\/@#$%^&*=+_|~`"0-9]/g, '').replace(/\s{2,}/g, ' ').slice(0, 60);

export const isValidName = (value: string) => /^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,59}$/u.test(value.trim());

export const VALIDATION_MSG = {
  email: 'कृपया एक वैध ईमेल पता दर्ज करें',
  mobile: 'कृपया 6, 7, 8 या 9 से शुरू होने वाला 10 अंकों का मोबाइल नंबर दर्ज करें',
  name: 'कृपया अपना सही नाम दर्ज करें (कम से कम 2 अक्षर, अंक या विशेष चिह्न नहीं)'
};
