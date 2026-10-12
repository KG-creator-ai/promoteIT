import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PUB = path.resolve(__dirname, '../../public');

function pngDims(file: string): { w: number; h: number } {
  const b = fs.readFileSync(path.join(PUB, file));
  expect(b.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

describe('PWA icon assets match manifest declarations', () => {
  it('icon-192x192.png is 192x192', () => {
    expect(pngDims('icon-192x192.png')).toEqual({ w: 192, h: 192 });
  });

  it('icon-512x512.png is 512x512', () => {
    expect(pngDims('icon-512x512.png')).toEqual({ w: 512, h: 512 });
  });

  it('apple-touch-icon.png is 180x180', () => {
    expect(pngDims('apple-touch-icon.png')).toEqual({ w: 180, h: 180 });
  });
});

describe('social preview asset', () => {
  it('og-image.png exists and is at least 1200x630', () => {
    expect(fs.existsSync(path.join(PUB, 'og-image.png'))).toBe(true);
    const { w, h } = pngDims('og-image.png');
    expect(w).toBeGreaterThanOrEqual(1200);
    expect(h).toBeGreaterThanOrEqual(630);
  });
});

describe('manifest ↔ file consistency (adversarial)', () => {
  it('every manifest icon size matches the actual file dimensions', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(PUB, 'manifest.webmanifest'), 'utf8'),
    );
    for (const icon of manifest.icons) {
      const file = icon.src.replace(/^\//, '');
      const [w, h] = icon.sizes.split('x').map(Number);
      expect(pngDims(file)).toEqual({ w, h });
    }
  });
});
