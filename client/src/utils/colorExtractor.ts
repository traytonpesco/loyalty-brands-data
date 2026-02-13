export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
}

const DEFAULT_COLORS: BrandColors = {
  primary: '#2F6BFF',
  secondary: '#1E90FF',
  accent: '#00BFFF',
  gradient: 'linear-gradient(135deg, #2F6BFF, #1E90FF, #00BFFF)',
};

export const extractColorsFromImage = (imageFile: File): Promise<BrandColors> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve(DEFAULT_COLORS);
        return;
      }

      const colors = extractDominantColors(imageData);
      resolve(colors);
    };

    img.onerror = () => {
      resolve(DEFAULT_COLORS);
    };

    img.src = URL.createObjectURL(imageFile);
  });
};

function extractDominantColors(imageData: ImageData): BrandColors {
  const data = imageData.data;
  const colorCounts: { [key: string]: number } = {};
  const colors: { r: number; g: number; b: number; count: number }[] = [];

  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128 || (r > 240 && g > 240 && b > 240)) continue;

    const qR = Math.floor(r / 32) * 32;
    const qG = Math.floor(g / 32) * 32;
    const qB = Math.floor(b / 32) * 32;

    const colorKey = `${qR},${qG},${qB}`;
    colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
  }

  Object.entries(colorCounts).forEach(([colorKey, count]) => {
    const [r, g, b] = colorKey.split(',').map(Number);
    colors.push({ r, g, b, count });
  });

  colors.sort((a, b) => b.count - a.count);

  if (colors.length === 0) {
    return DEFAULT_COLORS;
  }

  const primaryColor = colors[0];
  let secondaryColor = colors[1] || primaryColor;

  for (let i = 1; i < Math.min(colors.length, 5); i++) {
    const candidate = colors[i];
    const distance = Math.sqrt(
      Math.pow(candidate.r - primaryColor.r, 2) +
        Math.pow(candidate.g - primaryColor.g, 2) +
        Math.pow(candidate.b - primaryColor.b, 2)
    );
    if (distance > 100) {
      secondaryColor = candidate;
      break;
    }
  }

  const primaryHex = rgbToHex(primaryColor.r, primaryColor.g, primaryColor.b);
  const secondaryHex = rgbToHex(secondaryColor.r, secondaryColor.g, secondaryColor.b);
  const accentHex = rgbToHex(
    Math.min(255, primaryColor.r + 30),
    Math.min(255, primaryColor.g + 30),
    Math.min(255, primaryColor.b + 30)
  );

  return {
    primary: primaryHex,
    secondary: secondaryHex,
    accent: accentHex,
    gradient: `linear-gradient(135deg, ${primaryHex}, ${secondaryHex})`,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export const applyBrandColors = (colors: BrandColors) => {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', colors.primary);
  root.style.setProperty('--brand-secondary', colors.secondary);
  root.style.setProperty('--brand-accent', colors.accent);
  root.style.setProperty('--brand-gradient', colors.gradient);
};
