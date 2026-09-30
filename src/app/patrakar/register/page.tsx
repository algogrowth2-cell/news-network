import { redirect } from 'next/navigation';

// Purana bina-OTP register form hata diya — ab OTP-verified signup hi
export default function PatrakarRegisterRedirect() {
  redirect('/patrakar/signup');
}
