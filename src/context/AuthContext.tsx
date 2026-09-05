'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<any>;
  register: (e: string, p: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role || 'user');
        } else {
          setRole('user');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (e: string, p: string) => signInWithEmailAndPassword(auth, e, p);

  const register = async (e: string, p: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, e, p);
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email: e,
      role: 'user',
      status: 'verified',
      createdAt: new Date()
    });
    return cred;
  };

  const logout = () => signOut(auth);
  const resetPassword = (e: string) => sendPasswordResetEmail(auth, e);

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);