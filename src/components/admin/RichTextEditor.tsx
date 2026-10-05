'use client';

import React, { useEffect, useRef, useState } from 'react';
import { youtubeEmbedUrl, youtubeId } from '@/lib/articles';
import { uploadArticleMedia, uploadErrorMessage, validateMedia, type MediaKind } from '@/lib/mediaUpload';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ED_CSS = `
.rte-wrap{border:1px solid var(--bd-334155);border-radius:8px;background:var(--bg-020617);overflow:hidden}
.rte-bar{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:var(--bg-0b1120);border-bottom:1px solid var(--bd-334155);position:sticky;top:0;z-index:2}
.rte-btn{background:var(--bg-1e293b);border:1px solid transparent;color:var(--fg-cbd5e1);min-width:32px;height:30px;padding:0 9px;border-radius:5px;cursor:pointer;font-size:12.5px;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:4px}
.rte-btn:hover{background:var(--bg-334155);color:var(--fg-fff)}
.rte-btn:focus-visible{outline:2px solid #38bdf8;outline-offset:1px}
.rte-btn:disabled{opacity:.5;cursor:wait}
.rte-sep{width:1px;background:var(--bg-334155);margin:3px 2px}
.rte-area{min-height:340px;max-height:70vh;overflow-y:auto;padding:16px 18px;color:var(--fg-e2e8f0);font-size:15px;line-height:1.75;outline:none}
.rte-area:empty::before{content:attr(data-placeholder);color:#64748b}
.rte-area h2{font-size:22px;margin:18px 0 8px;color:var(--fg-fff)}
.rte-area h3{font-size:18px;margin:16px 0 6px;color:var(--fg-fff)}
.rte-area p{margin:0 0 12px}
.rte-area blockquote{border-left:3px solid #38bdf8;margin:12px 0;padding:6px 14px;color:var(--fg-cbd5e1);background:var(--bg-0b1120)}
.rte-area ul,.rte-area ol{padding-left:24px;margin:0 0 12px}
.rte-area a{color:var(--fg-38bdf8)}
.rte-area img,.rte-area video{max-width:100%;border-radius:6px;display:block;margin:10px 0}
.rte-area iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:6px;margin:10px 0}
.rte-area figure{margin:12px 0}
.rte-area figcaption{font-size:12.5px;color:var(--fg-94a3b8);text-align:center}
.rte-area hr{border:0;border-top:1px solid var(--bd-334155);margin:18px 0}
.rte-status{display:flex;justify-content:space-between;gap:10px;padding:6px 12px;border-top:1px solid var(--bd-1e293b);font-size:11.5px;color:#64748b}
`;

/** contentEditable par aadharit editor — HTML deta hai (article page par sanitize karke dikhta hai) */
export default function RichTextEditor({ value, onChange, placeholder = 'खबर का विस्तृत विवरण यहाँ लिखें…' }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ kind: MediaKind; pct: number } | null>(null);
  const [error, setError] = useState('');
  const [words, setWords] = useState(0);

  // Pehli baar (ya bahar se reset hone par) hi value daalo — har keystroke par nahi, warna cursor kood jaata hai
  useEffect(() => {
    const el = areaRef.current;
    if (el && el.innerHTML !== value && document.activeElement !== el) el.innerHTML = value;
    setWords((el?.innerText || '').split(/\s+/).filter(Boolean).length);
  }, [value]);

  const emit = () => {
    const el = areaRef.current;
    if (!el) return;
    onChange(el.innerHTML === '<br>' ? '' : el.innerHTML);
    setWords(el.innerText.split(/\s+/).filter(Boolean).length);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && areaRef.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    const el = areaRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    } else if (sel) {
      // Cursor nahi tha — aakhir me daalo
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
  };

  const exec = (cmd: string, arg?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, arg);
    saveSelection();
    emit();
  };
  const insertHtml = (html: string) => {
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    saveSelection();
    emit();
  };

  const addLink = () => {
    saveSelection();
    const url = window.prompt('लिंक का URL डालें (https://…)', 'https://');
    if (!url || !/^https?:\/\/\S+$/i.test(url.trim())) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) exec('createLink', url.trim());
    else insertHtml(`<a href="${esc(url.trim())}">${esc(url.trim())}</a>&nbsp;`);
  };

  const pickFile = (kind: MediaKind) => {
    saveSelection();
    setError('');
    (kind === 'image' ? imgInput : vidInput).current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, kind: MediaKind) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const bad = validateMedia(file, kind);
    if (bad) return setError(bad);
    setUploading({ kind, pct: 0 });
    try {
      const url = await uploadArticleMedia(file, kind, (pct) => setUploading({ kind, pct }));
      if (kind === 'image') {
        const caption = window.prompt('फ़ोटो का कैप्शन (वैकल्पिक)', '') || '';
        insertHtml(`<figure><img src="${esc(url)}" alt="${esc(caption)}">${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure><p><br></p>`);
      } else {
        insertHtml(`<video src="${esc(url)}" controls></video><p><br></p>`);
      }
    } catch (err) {
      console.error('Editor upload error:', err);
      setError(uploadErrorMessage(err));
    } finally {
      setUploading(null);
    }
  };

  const addImageUrl = () => {
    saveSelection();
    const url = (window.prompt('फ़ोटो का URL (https://…)', 'https://') || '').trim();
    if (!/^https:\/\/\S+$/i.test(url)) return;
    insertHtml(`<figure><img src="${esc(url)}" alt=""></figure><p><br></p>`);
  };

  const addYoutube = () => {
    saveSelection();
    const url = (window.prompt('YouTube वीडियो का लिंक डालें', '') || '').trim();
    if (!url) return;
    const id = youtubeId(url);
    if (!id) return setError('यह सही YouTube लिंक नहीं है।');
    insertHtml(`<iframe src="${youtubeEmbedUrl(id)}"></iframe><p><br></p>`);
  };

  // Bahar se copy kiya text saaf paragraphs me (doosri site ki styling/script nahi aati)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    const html = text
      .replace(/\r/g, '')
      .split(/\n{2,}/)
      .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
    document.execCommand('insertHTML', false, html);
    emit();
  };

  const busy = !!uploading;
  const B = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      className="rte-btn"
      title={title}
      aria-label={title}
      disabled={busy}
      onMouseDown={(e) => e.preventDefault()} // editor ka selection na jaaye
      onClick={onClick}
    >
      {children}
    </button>
  );

  return (
    <div className="rte-wrap">
      <style dangerouslySetInnerHTML={{ __html: ED_CSS }} />
      <div className="rte-bar" role="toolbar" aria-label="Formatting">
        <B title="बड़ा शीर्षक (H2)" onClick={() => exec('formatBlock', 'H2')}>H2</B>
        <B title="उप-शीर्षक (H3)" onClick={() => exec('formatBlock', 'H3')}>H3</B>
        <B title="सामान्य पैराग्राफ" onClick={() => exec('formatBlock', 'P')}>¶</B>
        <span className="rte-sep" />
        <B title="Bold" onClick={() => exec('bold')}><b>B</b></B>
        <B title="Italic" onClick={() => exec('italic')}><i>I</i></B>
        <B title="Underline" onClick={() => exec('underline')}><u>U</u></B>
        <B title="Strikethrough" onClick={() => exec('strikeThrough')}><s>S</s></B>
        <span className="rte-sep" />
        <B title="बुलेट सूची" onClick={() => exec('insertUnorderedList')}>• सूची</B>
        <B title="क्रमांकित सूची" onClick={() => exec('insertOrderedList')}>1. सूची</B>
        <B title="उद्धरण (Quote)" onClick={() => exec('formatBlock', 'BLOCKQUOTE')}>❝</B>
        <B title="विभाजक रेखा" onClick={() => insertHtml('<hr><p><br></p>')}>—</B>
        <B title="लिंक" onClick={addLink}>🔗</B>
        <span className="rte-sep" />
        <B title="डिवाइस से फ़ोटो लगाएं" onClick={() => pickFile('image')}>🖼️ फ़ोटो</B>
        <B title="फ़ोटो URL से" onClick={addImageUrl}>🌐 फ़ोटो URL</B>
        <B title="डिवाइस से वीडियो लगाएं" onClick={() => pickFile('video')}>🎬 वीडियो</B>
        <B title="YouTube वीडियो" onClick={addYoutube}>▶ YouTube</B>
        <span className="rte-sep" />
        <B title="फ़ॉर्मेटिंग हटाएं" onClick={() => exec('removeFormat')}>⌫ Tx</B>
        <B title="Undo" onClick={() => exec('undo')}>↶</B>
        <B title="Redo" onClick={() => exec('redo')}>↷</B>
      </div>

      <div
        ref={areaRef}
        className="rte-area"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="खबर का कंटेंट"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={() => {
          saveSelection();
          emit();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onPaste={handlePaste}
      />

      <div className="rte-status">
        <span>
          {uploading
            ? `${uploading.kind === 'image' ? 'फ़ोटो' : 'वीडियो'} अपलोड हो रहा है… ${uploading.pct}%`
            : error
              ? <span style={{ color: 'var(--fg-f87171)' }}>{error}</span>
              : 'टिप: फ़ोटो/वीडियो वहीं जुड़ेगा जहाँ कर्सर है'}
        </span>
        <span>{words} शब्द · ~{Math.max(1, Math.round(words / 200))} मिनट पढ़ने का समय</span>
      </div>

      <input ref={imgInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => handleFile(e, 'image')} />
      <input ref={vidInput} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" hidden onChange={(e) => handleFile(e, 'video')} />
    </div>
  );
}
