import { redirect } from 'next/navigation';

// Purana bina-OTP register form hata diya — ab OTP-verified signup hi
export default function AdvertiserRegisterRedirect() {
  redirect('/advertiser/signup');
}
