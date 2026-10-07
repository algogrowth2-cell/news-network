// Har vigyapan format ka fix size — website par isi anupaat (ratio) me dikhta hai.
// Advertiser ki upload ki hui photo browser me hi beech se crop + resize hoti hai (sahi ratio, chhoti file).

export const AD_IMAGE_SIZE = {
  classified: { w: 400, h: 300, label: '400 × 300' },
  sidebar: { w: 300, h: 250, label: '300 × 250' },
  banner: { w: 728, h: 90, label: '728 × 90' },
  popup: { w: 600, h: 500, label: '600 × 500' }
} as const;
export type AdImageFormat = keyof typeof AD_IMAGE_SIZE;

/** Photo ko format ke ratio me beech se crop karke 2x resolution (saaf dikhe) JPEG data URL banata hai */
export function fitAdImage(file: File, format: AdImageFormat): Promise<string> {
  const { w, h } = AD_IMAGE_SIZE[format];
  const scale = 2;
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const target = w / h;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      let sx = 0;
      let sy = 0;
      if (sw / sh > target) {
        sw = Math.round(sh * target);
        sx = Math.round((img.naturalWidth - sw) / 2);
      } else {
        sh = Math.round(sw / target);
        sy = Math.round((img.naturalHeight - sh) / 2);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}
