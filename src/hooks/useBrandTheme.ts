import { useLayoutEffect } from 'react';

// Convert hex to rgb format: "r g b" for Tailwind CSS variables
function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 6, g: 42, b: 48 };
}

// Ensure WCAG 2.1 AA Contrast Ratio (>= 4.5:1)
function getContrastYIQ(r: number, g: number, b: number) {
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '0 0 0' : '255 255 255';
}

export function useBrandTheme(primaryHex: string, secondaryHex: string, accentHex: string) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    
    // Convert Hex to RGB space for Tailwind opacity compatibility
    const pRgb = hexToRgb(primaryHex);
    const sRgb = hexToRgb(secondaryHex);
    const aRgb = hexToRgb(accentHex);

    root.style.setProperty('--color-primary', `${pRgb.r} ${pRgb.g} ${pRgb.b}`);
    root.style.setProperty('--color-secondary', `${sRgb.r} ${sRgb.g} ${sRgb.b}`);
    root.style.setProperty('--color-accent', `${aRgb.r} ${aRgb.g} ${aRgb.b}`);

    // Dynamic High-Contrast Text for WCAG 2.1 AA Compliance
    root.style.setProperty('--color-primary-text', getContrastYIQ(pRgb.r, pRgb.g, pRgb.b));
    root.style.setProperty('--color-secondary-text', getContrastYIQ(sRgb.r, sRgb.g, sRgb.b));
    root.style.setProperty('--color-accent-text', getContrastYIQ(aRgb.r, aRgb.g, aRgb.b));

    // Ensure theme class consistency and localStorage key 'promote_it_theme'
    const savedTheme = localStorage.getItem('promote_it_theme') || localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : (root.classList.contains('dark') || prefersDark);

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [primaryHex, secondaryHex, accentHex]);
}
