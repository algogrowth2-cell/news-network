'use client';
import { useState } from 'react';
import styles from '../Admin.module.css';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([
    { id: '1', name: 'Politics', nameHi: 'राजनीति', slug: 'politics', order: 1, active: true, color: '#ef4444' },
    { id: '2', name: 'National', nameHi: 'देश', slug: 'national', order: 2, active: true, color: '#3b82f6' },
    { id: '3', name: 'International', nameHi: 'अंतरराष्ट्रीय', slug: 'international', order: 3, active: true, color: '#10b981' },
    { id: '4', name: 'Sports', nameHi: 'खेल', slug: 'sports', order: 4, active: true, color: '#f59e0b' },
    { id: '5', name: 'Entertainment', nameHi: 'मनोरंजन', slug: 'entertainment', order: 5, active: true, color: '#ec4899' },
    { id: '6', name: 'Business', nameHi: 'व्यापार', slug: 'business', order: 6, active: true, color: '#8b5cf6' },
    { id: '7', name: 'Technology', nameHi: 'तकनीक', slug: 'technology', order: 7, active: true, color: '#06b6d4' },
    { id: '8', name: 'Education', nameHi: 'शिक्षा', slug: 'education', order: 8, active: true, color: '#6366f1' },
    { id: '9', name: 'Health', nameHi: 'स्वास्थ्य', slug: 'health', order: 9, active: true, color: '#14b8a6' },
    { id: '10', name: 'Crime', nameHi: 'अपराध', slug: 'crime', order: 10, active: true, color: '#dc2626' },
    { id: '11', name: 'Lifestyle', nameHi: 'जीवनशैली', slug: 'lifestyle', order: 11, active: true, color: '#84cc16' },
    { id: '12', name: 'Agriculture', nameHi: 'कृषि', slug: 'agriculture', order: 12, active: true, color: '#22c55e' }
  ]);

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Categories ({categories.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Manage global news categories and multi-language tags</p>
        </div>
        <button className={styles.btnPrimary}>+ New Category</button>
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
              <th style={{ padding: '14px 16px' }}>Color</th>
              <th style={{ padding: '14px 16px' }}>Name (EN)</th>
              <th style={{ padding: '14px 16px' }}>Name (Hindi)</th>
              <th style={{ padding: '14px 16px' }}>Slug</th>
              <th style={{ padding: '14px 16px' }}>Order</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: c.color }} />
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: '12px 16px' }}>{c.nameHi}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{c.slug}</td>
                <td style={{ padding: '12px 16px' }}>{c.order}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: '#065f46', color: '#34d399' }}>Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}