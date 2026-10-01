// WhatsApp / native share ke liye common helpers (article page aur aage koi bhi share button)

export interface ShareContent {
  title: string;
  summary?: string;
  url: string;
}

const SNIPPET_LENGTH = 100;

// HTML tags / extra spaces hata kar pehle ~100 akshar (Hindi ke combining marks ke beech se nahi katta)
const makeSnippet = (text = '') => {
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= SNIPPET_LENGTH) return clean;
  const chars = Array.from(clean);
  let cut = chars.slice(0, SNIPPET_LENGTH).join('');
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > SNIPPET_LENGTH * 0.6) cut = cut.slice(0, lastSpace);
  return `${cut}...`;
};

// 📰 *Headline*  +  summary  +  "पूरी खबर..." (link ke bina — native share link alag field me bhejta hai)
const buildShareText = ({ title, summary }: Omit<ShareContent, 'url'>) =>
  [`📰 *${title.trim()}*`, makeSnippet(summary), 'पूरी खबर पढ़ने के लिए लिंक पर क्लिक करें:'].filter(Boolean).join('\n\n');

export const buildShareMessage = (content: ShareContent) => `${buildShareText(content)}\n${content.url}`;

export const whatsappShareUrl = (content: ShareContent) =>
  `https://api.whatsapp.com/send?text=${encodeURIComponent(buildShareMessage(content))}`;

export const facebookShareUrl = (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

export const twitterShareUrl = ({ title, url }: ShareContent) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(`📰 ${title.trim()}`)}&url=${encodeURIComponent(url)}`;

const openInNewTab = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');

// Mobile par native share sheet (navigator.share); na ho ya fail ho toh seedha WhatsApp
export async function shareNativeOrWhatsApp(content: ShareContent) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: content.title, text: buildShareText(content), url: content.url });
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // user ne khud share sheet band ki
    }
  }
  openInNewTab(whatsappShareUrl(content));
}

// Link copy; clipboard API na mile (http / purane browser) toh prompt me link dikha do
export async function copyShareLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    window.prompt('इस लिंक को कॉपी करें:', url);
    return false;
  }
}
