import { redirect } from 'next/navigation';

// Purana bina-OTP, password-wala register form hata diya — reader signup ab /login (OTP + validation) par hi
export default function ReaderRegisterRedirect() {
  redirect('/login');
}
