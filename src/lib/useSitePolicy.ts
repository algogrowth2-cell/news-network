'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/*
 * Policy pages (privacy / terms / editorial / grievance) ka admin-override.
 * settings/policies me { <key>: { title, html } }. html ho toh wahi dikhta hai, warna page ka default.
 */
export type PolicyKey = 'privacy' | 'terms' | 'editorial' | 'grievance';
export interface PolicyEntry { title: string; html: string; }
export type SitePolicies = Record<PolicyKey, PolicyEntry>;

export const EMPTY_POLICIES: SitePolicies = {
  privacy: { title: '', html: '' }, terms: { title: '', html: '' },
  editorial: { title: '', html: '' }, grievance: { title: '', html: '' }
};

// Basic safai — admin ka content hai par public dikhta hai: script/style/on* /javascript: hatao
export function sanitizePolicyHtml(raw: string): string {
  let s = String(raw || '');
  s = s.replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  s = s.replace(/(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '$1="#"');
  return s.trim();
}

const entry = (raw: any): PolicyEntry => ({
  title: String(raw?.title || '').replace(/[<>]/g, '').trim().slice(0, 120),
  html: sanitizePolicyHtml(raw?.html).slice(0, 60000)
});
export function normalizePolicies(raw: any): SitePolicies {
  return {
    privacy: entry(raw?.privacy), terms: entry(raw?.terms),
    editorial: entry(raw?.editorial), grievance: entry(raw?.grievance)
  };
}

let cached: Promise<SitePolicies> | null = null;
export function loadPolicies(): Promise<SitePolicies> {
  if (!cached) {
    cached = getDoc(doc(db, 'settings', 'policies'))
      .then((s) => normalizePolicies(s.exists() ? s.data() : {}))
      .catch(() => { cached = null; return EMPTY_POLICIES; });
  }
  return cached;
}

/** Ek policy ka override (null = loading/na ho; html khali = default page dikhao) */
export function useSitePolicy(key: PolicyKey): PolicyEntry | null {
  const [p, setP] = useState<PolicyEntry | null>(null);
  useEffect(() => { let a = true; loadPolicies().then((x) => a && setP(x[key])); return () => { a = false; }; }, [key]);
  return p;
}
