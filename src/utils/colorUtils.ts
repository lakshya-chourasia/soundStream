export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// Deterministic rich ambient fallback palettes based on track/artist seed
export function getFallbackColor(seed: string): RGBColor {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const palettes: RGBColor[] = [
    { r: 85, g: 30, b: 55 },   // Deep velvet berry
    { r: 35, g: 45, b: 90 },   // Midnight ocean
    { r: 90, g: 45, b: 20 },   // Warm amber / burnt orange
    { r: 25, g: 70, b: 60 },   // Emerald night
    { r: 70, g: 25, b: 90 },   // Royal indigo
    { r: 90, g: 30, b: 35 },   // Dark crimson
    { r: 40, g: 55, b: 70 },   // Slate navy
    { r: 95, g: 70, b: 20 },   // Golden aura
    { r: 50, g: 35, b: 80 },   // Astral violet
    { r: 80, g: 35, b: 70 },   // Electric plum
  ];
  const idx = Math.abs(hash) % palettes.length;
  return palettes[idx];
}

// In-memory cache of extracted image colors to avoid re-extracting
const colorCache = new Map<string, RGBColor>();

/**
 * Extracts dominant vibrant RGB color from an image URL using an offscreen canvas.
 * Seamlessly falls back to seed-based palette on CORS or load issues.
 */
export function extractColorFromImage(imageUrl: string, fallbackSeed = ''): Promise<RGBColor> {
  if (!imageUrl || typeof window === 'undefined') {
    return Promise.resolve(getFallbackColor(fallbackSeed));
  }

  if (colorCache.has(imageUrl)) {
    return Promise.resolve(colorCache.get(imageUrl)!);
  }

  return new Promise((resolve) => {
    const fallback = getFallbackColor(fallbackSeed || imageUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    let hasResolved = false;
    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        resolve(fallback);
      }
    }, 1500);

    img.onload = () => {
      if (hasResolved) return;
      clearTimeout(timeout);
      hasResolved = true;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallback);
          return;
        }

        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a > 128) {
            // Exclude extreme darks and extreme highlights to sample the dominant theme tone
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness > 28 && brightness < 230) {
              rSum += r;
              gSum += g;
              bSum += b;
              count++;
            }
          }
        }

        if (count > 0) {
          let r = Math.round(rSum / count);
          let g = Math.round(gSum / count);
          let b = Math.round(bSum / count);

          // Ensure color has sufficient presence and richness for moody background
          const max = Math.max(r, g, b, 1);
          if (max < 85) {
            const boost = 85 / max;
            r = Math.min(255, Math.round(r * boost));
            g = Math.min(255, Math.round(g * boost));
            b = Math.min(255, Math.round(b * boost));
          }

          const extracted: RGBColor = { r, g, b };
          colorCache.set(imageUrl, extracted);
          resolve(extracted);
          return;
        }
      } catch {
        // Non-fatal, fall through to fallback
      }

      colorCache.set(imageUrl, fallback);
      resolve(fallback);
    };

    img.onerror = () => {
      if (hasResolved) return;
      clearTimeout(timeout);
      hasResolved = true;
      colorCache.set(imageUrl, fallback);
      resolve(fallback);
    };

    img.src = imageUrl;
  });
}
