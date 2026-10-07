'use client';
import type { CSSProperties, ReactNode } from 'react';
import { ClayDiya, CornerOrnament, damaskBg, FlowerBed, HangingDiya, Incense, Leaf, MarigoldToran, OrnateDivider, Rose } from './ShokArt';

/*
 * Shok sandesh card — 5 asli jaise design (sunehri frame, latakte diye, genda / gulab, nakkashi).
 * Template IDs purane hi hain (pehle bane sandesh bhi naye design me dikhte hain).
 */

export type ShokTemplateId = 'golden-frame' | 'divine-blue' | 'floral-white' | 'rose-border' | 'classic-silver';

export const SHOK_TEMPLATES: { id: ShokTemplateId; name: string; swatch: string }[] = [
  { id: 'golden-frame', name: 'पारंपरिक स्वर्ण', swatch: 'linear-gradient(135deg,#fdf6e3,#e9c46a)' },
  { id: 'divine-blue', name: 'गेंदा व पीतल', swatch: 'linear-gradient(135deg,#fff8ee,#ff9800 60%,#7b1e1e)' },
  { id: 'floral-white', name: 'गुलाबी पुष्प', swatch: 'linear-gradient(135deg,#ffffff,#f8bbd0 60%,#d84315)' },
  { id: 'rose-border', name: 'मैजेंटा श्रद्धांजलि', swatch: 'linear-gradient(135deg,#fff0f8,#e91e8c)' },
  { id: 'classic-silver', name: 'श्वेत शांति', swatch: 'linear-gradient(135deg,#ffffff,#cfd8dc 60%,#455a64)' }
];

export interface ShokCardData {
  name?: string;
  relation?: string;
  passedDate?: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  address?: string;
  familyMembers?: string;
  contactNumber?: string;
  templateId?: string;
}

const SERIF = '"Tiro Devanagari Hindi", "Noto Serif Devanagari", "Noto Sans Devanagari", Georgia, serif';
const SANS = '"Noto Sans Devanagari", "Mukta", system-ui, sans-serif';

/** Gol sunehri frame */
function RoundFrame({ photo, size, alt }: { photo: string; size: number; alt: string }) {
  return (
    <div style={{ width: size, height: size, margin: '0 auto', borderRadius: '50%', padding: 7, boxSizing: 'border-box', background: 'conic-gradient(from 20deg,#7a5200,#f6d77a,#b8860b,#fff1b8,#8a5a00,#f6d77a,#7a5200)', boxShadow: '0 6px 18px rgba(122,82,0,.35)' }}>
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', padding: 3, boxSizing: 'border-box', background: '#fff8e1' }}>
        <img src={photo} alt={alt} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
      </div>
    </div>
  );
}

/** Chaukor sunehri (nakkashi wala) frame */
function RectFrame({ photo, w, h, alt }: { photo: string; w: number; h: number; alt: string }) {
  return (
    <div style={{ width: w, height: h, margin: '0 auto', padding: 9, boxSizing: 'border-box', background: 'linear-gradient(135deg,#7a5200 0%,#f6d77a 22%,#b8860b 45%,#fff1b8 60%,#9a6a00 80%,#f6d77a 100%)', boxShadow: '0 8px 20px rgba(80,50,0,.35), inset 0 0 0 2px #5c3d00' }}>
      <div style={{ width: '100%', height: '100%', padding: 3, boxSizing: 'border-box', background: 'linear-gradient(135deg,#5c3d00,#d4a437)' }}>
        <img src={photo} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    </div>
  );
}

const Corners = ({ size, color }: { size: number; color?: string }) => (
  <>
    <div style={{ position: 'absolute', top: 6, left: 6, lineHeight: 0 }}><CornerOrnament size={size} corner="tl" color={color} /></div>
    <div style={{ position: 'absolute', top: 6, right: 6, lineHeight: 0 }}><CornerOrnament size={size} corner="tr" color={color} /></div>
    <div style={{ position: 'absolute', bottom: 6, left: 6, lineHeight: 0 }}><CornerOrnament size={size} corner="bl" color={color} /></div>
    <div style={{ position: 'absolute', bottom: 6, right: 6, lineHeight: 0 }}><CornerOrnament size={size} corner="br" color={color} /></div>
  </>
);

const Abs = ({ style, children }: { style: CSSProperties; children: ReactNode }) => <div style={{ position: 'absolute', lineHeight: 0, ...style }}>{children}</div>;

export default function ShokCard({ data, photo, isPreview = false }: { data: ShokCardData; photo: string; isPreview?: boolean }) {
  const t = (data.templateId || 'golden-frame') as ShokTemplateId;
  const name = data.name || 'दिवंगत का नाम';
  const relation = data.relation || 'स्वजन';
  const passed = data.passedDate || '—';
  const evDate = data.eventDate || '—';
  const evTime = data.eventTime || '—';
  const place = data.address || 'निवास स्थल';
  const family = data.familyMembers || 'समस्त शोक संतप्त परिवार';
  const mobile = data.contactNumber;
  const shell: CSSProperties = {
    width: '100%',
    maxWidth: isPreview ? '100%' : 480,
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    textAlign: 'center',
    fontFamily: SANS,
    borderRadius: 14
  };

  // ── 1. पारंपरिक स्वर्ण (क्रीम + सुनहरी नक्काशी + गोल फ्रेम) ──
  if (t === 'golden-frame') {
    return (
      <div style={{ ...shell, background: `${damaskBg('#c9a24a', 0.16)}, linear-gradient(180deg,#fffaf0,#f8ecd1)`, border: '1px solid #e2c98a', boxShadow: '0 10px 30px rgba(120,80,0,.15)', padding: '22px 26px 0' }}>
        <div style={{ position: 'absolute', inset: 10, border: '2px solid #c9a24a', borderRadius: 8, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 15, border: '1px solid #e2c98a', borderRadius: 6, pointerEvents: 'none' }} />
        <Corners size={58} />
        <Abs style={{ top: 0, left: 54 }}><HangingDiya height={108} width={32} /></Abs>
        <Abs style={{ top: 0, right: 54 }}><HangingDiya height={108} width={32} /></Abs>
        <Abs style={{ top: 0, left: 92 }}><HangingDiya height={78} width={24} /></Abs>
        <Abs style={{ top: 0, right: 92 }}><HangingDiya height={78} width={24} /></Abs>

        <div style={{ fontFamily: SERIF, fontSize: 25, fontWeight: 800, color: '#7a1f1f', margin: '6px 0 12px', letterSpacing: 1 }}>॥ शोक संदेश ॥</div>
        <RoundFrame photo={photo} size={150} alt={name} />
        <div style={{ marginTop: -18 }}><FlowerBed kind="mixed" width={250} /></div>

        <div style={{ fontSize: 13, color: '#4a3410', marginTop: 4 }}>अत्यंत दुःख का विषय है कि हमारे {relation}</div>
        <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 800, color: '#b0186a', margin: '2px 0 2px', lineHeight: 1.3 }}>स्व. {name}</div>
        <div style={{ fontSize: 13, color: '#4a3410', lineHeight: 1.65 }}>
          का स्वर्गवास दिनांक <b>{passed}</b> को हो गया है।
          <br />
          उनकी दिवंगत आत्मा की शांति हेतु निम्नलिखित कार्यक्रम में सम्मिलित होकर हमें कृतार्थ करें।
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '12px 0 6px' }}>
          <ClayDiya size={44} />
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 800, color: '#8a1c1c' }}>-: श्रद्धांजलि कार्यक्रम :-</div>
            <div style={{ fontSize: 13, color: '#3d2a0a', marginTop: 2 }}>दिनांक {evDate}</div>
            <div style={{ fontSize: 13, color: '#3d2a0a' }}>समय: {evTime}</div>
          </div>
          <ClayDiya size={44} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'center', margin: '10px 4px 12px' }}>
          <div>
            <div style={{ fontFamily: SERIF, fontWeight: 800, color: '#8a1c1c', fontSize: 15 }}>-: कार्यक्रम पता :-</div>
            <div style={{ fontSize: 12.5, color: '#3d2a0a', lineHeight: 1.5 }}>{place}</div>
          </div>
          <div>
            <div style={{ fontFamily: SERIF, fontWeight: 800, color: '#8a1c1c', fontSize: 15 }}>-: विनीत :-</div>
            <div style={{ fontSize: 12.5, color: '#3d2a0a', lineHeight: 1.5 }}>{family}</div>
            {mobile && <div style={{ fontSize: 12, color: '#3d2a0a' }}>मोबाइल: {mobile}</div>}
          </div>
        </div>
        <div style={{ margin: '0 -26px', padding: '9px 12px 22px', fontFamily: SERIF, fontWeight: 800, fontSize: 15, color: '#7a1f1f' }}>
          <OrnateDivider width={200} />
          <div>शोकाकुल – {family}</div>
        </div>
      </div>
    );
  }

  // ── 2. गेंदा व पीतल (तोरण + चौकोर स्वर्ण फ्रेम + मैरून पट्टी) ──
  if (t === 'divine-blue') {
    return (
      <div style={{ ...shell, background: 'radial-gradient(120% 80% at 50% 30%,#ffffff 0%,#fff6e8 60%,#f6e3c4 100%)', border: '1px solid #ecd2a6', boxShadow: '0 10px 30px rgba(120,60,0,.15)', padding: '100px 22px 0' }}>
        <MarigoldToran width={480} strands={9} />
        <Abs style={{ top: 10, left: 10 }}><HangingDiya height={118} width={34} /></Abs>
        <Abs style={{ top: 10, right: 10 }}><HangingDiya height={118} width={34} /></Abs>

        <div style={{ display: 'inline-block', fontFamily: SERIF, fontSize: 24, fontWeight: 800, color: '#fff', background: 'linear-gradient(180deg,#9b1c1c,#6d0f0f)', padding: '4px 22px', borderRadius: 6, boxShadow: '0 3px 8px rgba(109,15,15,.35)', margin: '0 0 14px' }}>
          ॥ भावपूर्ण श्रद्धांजलि ॥
        </div>
        <RectFrame photo={photo} w={170} h={200} alt={name} />
        <div style={{ marginTop: -30, position: 'relative' }}><FlowerBed kind="sunflower" width={260} /></div>

        <div style={{ fontFamily: SERIF, fontSize: 25, fontWeight: 800, color: '#7a1414', marginTop: 2, lineHeight: 1.3 }}>कै. {name}</div>
        <div style={{ fontSize: 13.5, color: '#3b2208', margin: '2px 0 6px' }}>({relation}) · देहावसान: <b>{passed}</b></div>
        <OrnateDivider width={220} color="#9b1c1c" />
        <div style={{ fontSize: 13, color: '#5a1010', fontWeight: 700, margin: '6px 0' }}>आपकी यादें सदा हमारे हृदय में जीवित रहेंगी।</div>

        <div style={{ display: 'inline-block', background: 'linear-gradient(180deg,#b71c1c,#7f0e0e)', color: '#ffe082', fontWeight: 800, fontFamily: SERIF, fontSize: 16, padding: '4px 18px', borderRadius: 4, margin: '6px 0 4px' }}>
          ❖ श्रद्धांजलि सभा ❖
        </div>
        <div style={{ fontSize: 13.5, color: '#3b2208', fontWeight: 700 }}>{evDate} · {evTime}</div>
        <div style={{ fontSize: 12.5, color: '#3b2208', margin: '2px 8px 12px' }}>{place}</div>

        <div style={{ margin: '0 -22px', background: 'linear-gradient(180deg,#a3172b,#6e0b1a)', color: '#ffd54f', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <ClayDiya size={34} />
          <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 16 }}>
            शोकाकुल : {family}
            {mobile && <div style={{ fontSize: 11.5, fontFamily: SANS, color: '#ffe9a8', fontWeight: 600 }}>मो. {mobile}</div>}
          </div>
          <ClayDiya size={34} />
        </div>
      </div>
    );
  }

  // ── 3. गुलाबी पुष्प (कोनों में गुलाब + सुनहरा फ्रेम) ──
  if (t === 'floral-white') {
    const roseCorner = (flip: boolean) => (
      <div style={{ position: 'relative', width: 120, height: 80, transform: flip ? 'scaleX(-1)' : undefined }}>
        <Abs style={{ left: 0, top: 0 }}><Rose size={46} color="#ec407a" /></Abs>
        <Abs style={{ left: 34, top: -6 }}><Rose size={34} color="#f48fb1" /></Abs>
        <Abs style={{ left: 8, top: 34 }}><Rose size={30} color="#d81b60" /></Abs>
        <Abs style={{ left: 60, top: 6 }}><Leaf size={30} rotate={-10} color="#558b2f" /></Abs>
        <Abs style={{ left: 40, top: 34 }}><Leaf size={26} rotate={40} color="#689f38" /></Abs>
        <Abs style={{ left: 82, top: 18 }}><Rose size={22} color="#f8bbd0" /></Abs>
      </div>
    );
    return (
      <div style={{ ...shell, background: 'linear-gradient(180deg,#ffffff 0%,#fff7f8 55%,#fdeef1 100%)', border: '1px solid #f3d0da', boxShadow: '0 10px 30px rgba(180,40,90,.12)', padding: '30px 22px 22px' }}>
        <Abs style={{ top: -8, left: -8 }}>{roseCorner(false)}</Abs>
        <Abs style={{ top: -8, right: -8 }}>{roseCorner(true)}</Abs>
        <Abs style={{ top: 0, left: 112 }}><HangingDiya height={96} width={30} /></Abs>
        <Abs style={{ top: 0, right: 112 }}><HangingDiya height={96} width={30} /></Abs>

        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 800, color: '#c62828', margin: '8px 0 12px', fontStyle: 'italic', textShadow: '0 1px 0 #fff' }}>भावपूर्ण श्रद्धांजलि</div>
        <RectFrame photo={photo} w={168} h={196} alt={name} />
        <div style={{ marginTop: -28, position: 'relative' }}><FlowerBed kind="rose" width={250} /></div>

        <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 800, color: '#d84315', marginTop: 4, lineHeight: 1.3 }}>कै. {name}</div>
        <div style={{ fontSize: 13, color: '#4e342e', margin: '2px 0 10px' }}>({relation}) · स्वर्गवास: <b>{passed}</b></div>

        <div style={{ display: 'inline-block', background: '#e65100', color: '#fff', fontWeight: 800, fontSize: 13.5, padding: '3px 14px', borderRadius: 20 }}>✿ शोकसभा ✿</div>
        <div style={{ fontSize: 13.5, color: '#3e2723', margin: '4px 0 8px' }}>{evDate} · {evTime}</div>
        <div style={{ display: 'inline-block', background: '#e65100', color: '#fff', fontWeight: 800, fontSize: 13.5, padding: '3px 14px', borderRadius: 20 }}>✿ पता ✿</div>
        <div style={{ fontSize: 13, color: '#3e2723', margin: '4px 12px 12px', lineHeight: 1.5 }}>{place}</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: '#c2185b', fontWeight: 700 }}>• शोकाकुल :</span>
          <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 800, color: '#33691e' }}>{family}</span>
        </div>
        {mobile && <div style={{ fontSize: 12, color: '#5d4037', marginTop: 2 }}>मो. {mobile}</div>}
      </div>
    );
  }

  // ── 4. मैजेंटा श्रद्धांजलि (मोटा गुलाबी बॉर्डर + श्लोक + अगरबत्ती) ──
  if (t === 'rose-border') {
    return (
      <div style={{ ...shell, background: 'linear-gradient(180deg,#fff5fb 0%,#ffe4f2 100%)', border: '7px solid #e0119a', boxShadow: '0 10px 30px rgba(224,17,154,.2), inset 0 0 0 3px #ffd1ec', padding: '20px 20px 18px' }}>
        <Abs style={{ top: 2, left: 4 }}><HangingDiya height={100} width={30} /></Abs>
        <Abs style={{ top: 2, right: 4 }}><HangingDiya height={100} width={30} /></Abs>
        <div style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'left center', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 800, color: '#c2187e', marginLeft: 8 }}>
          देहावसान {passed}
        </div>

        <div style={{ fontFamily: SERIF, fontSize: 27, fontWeight: 800, color: '#d50000', margin: '2px 0 4px' }}>भावपूर्ण श्रद्धांजलि</div>
        <div style={{ fontFamily: SERIF, fontSize: 12.5, color: '#4a0d33', fontWeight: 700, lineHeight: 1.5, marginBottom: 10 }}>
          नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः ।<br />न चैनं क्लेदयन्त्यापो न शोषयति मारुतः ॥
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 14 }}>
          <Incense height={86} />
          <div>
            <RectFrame photo={photo} w={172} h={200} alt={name} />
            <div style={{ marginTop: -28, position: 'relative' }}><FlowerBed kind="mixed" width={240} /></div>
          </div>
          <Incense height={86} />
        </div>

        <div style={{ fontSize: 13, color: '#880e4f', fontWeight: 700, marginTop: 2 }}>{relation}</div>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 800, color: '#d50000', lineHeight: 1.25 }}>{name}</div>
        <div style={{ fontSize: 12.5, color: '#4a0d33', margin: '2px 0 8px' }}>भगवान इस पुण्य आत्मा को अपने चरणों में स्थान दें · ॐ शांति ॐ</div>

        <div style={{ background: '#ffffffcc', border: '1px solid #f8bbd9', borderRadius: 10, padding: '8px 10px', margin: '0 8px 10px' }}>
          <div style={{ fontWeight: 800, color: '#ad1457', fontSize: 14 }}>श्रद्धांजलि कार्यक्रम</div>
          <div style={{ fontSize: 12.5, color: '#3c0a28' }}>{evDate} · {evTime}</div>
          <div style={{ fontSize: 12, color: '#3c0a28' }}>{place}</div>
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 800, color: '#6a1b9a', fontSize: 15 }}>शोकाकुल : {family}</div>
        {mobile && <div style={{ fontSize: 12, color: '#4a0d33' }}>मो. {mobile}</div>}
      </div>
    );
  }

  // ── 5. श्वेत शांति (सफ़ेद / चाँदी + सफ़ेद गुलाब) ──
  return (
    <div style={{ ...shell, background: `${damaskBg('#90a4ae', 0.14)}, linear-gradient(180deg,#ffffff,#eef2f4)`, border: '1px solid #cfd8dc', boxShadow: '0 10px 30px rgba(38,50,56,.14)', padding: '24px 24px 20px' }}>
      <div style={{ position: 'absolute', inset: 9, border: '1.5px solid #b0bec5', borderRadius: 8, pointerEvents: 'none' }} />
      <Corners size={54} color="#78909c" />
      <Abs style={{ top: 0, left: 64 }}><HangingDiya height={96} width={30} /></Abs>
      <Abs style={{ top: 0, right: 64 }}><HangingDiya height={96} width={30} /></Abs>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#546e7a', letterSpacing: 2, margin: '4px 0 6px' }}>॥ ॐ शान्तिः शान्तिः शान्तिः ॥</div>
      <div style={{ fontFamily: SERIF, fontSize: 25, fontWeight: 800, color: '#263238', margin: '0 0 12px' }}>विनम्र श्रद्धांजलि</div>
      <RoundFrame photo={photo} size={150} alt={name} />
      <div style={{ marginTop: -14 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 2 }}>
          <Leaf size={32} rotate={-30} color="#607d8b" />
          <Rose size={38} color="#eceff1" />
          <Rose size={48} color="#f5f5f5" />
          <Rose size={38} color="#eceff1" />
          <Leaf size={32} rotate={210} color="#607d8b" />
        </div>
      </div>

      <div style={{ fontSize: 13, color: '#37474f', marginTop: 6 }}>अत्यंत दुःख के साथ सूचित करना पड़ रहा है कि हमारे {relation}</div>
      <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 800, color: '#1c313a', margin: '2px 0' }}>स्व. {name}</div>
      <div style={{ fontSize: 13, color: '#37474f' }}>का स्वर्गवास <b>{passed}</b> को हो गया है।</div>
      <div style={{ margin: '8px 0' }}><OrnateDivider width={200} color="#78909c" /></div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <ClayDiya size={38} />
        <div>
          <div style={{ fontWeight: 800, color: '#37474f', fontSize: 15 }}>श्रद्धांजलि सभा</div>
          <div style={{ fontSize: 12.5, color: '#455a64' }}>{evDate} · {evTime}</div>
          <div style={{ fontSize: 12, color: '#455a64' }}>{place}</div>
        </div>
        <ClayDiya size={38} />
      </div>
      <div style={{ borderTop: '1px solid #cfd8dc', marginTop: 12, paddingTop: 8 }}>
        <div style={{ fontFamily: SERIF, fontWeight: 800, color: '#263238', fontSize: 15 }}>शोकाकुल – {family}</div>
        {mobile && <div style={{ fontSize: 12, color: '#546e7a' }}>मो. {mobile}</div>}
      </div>
    </div>
  );
}
