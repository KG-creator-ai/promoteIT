const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height) {
  // Minimal valid PNG: teal (#19988B) solid color
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk - raw image data
  const stride = 1 + width * 3; // filter byte + RGB per pixel per row
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const offset = y * stride;
    raw[offset] = 0; // no filter
    for (let x = 0; x < width; x++) {
      raw[offset + 1 + x * 3] = 0x19; // R
      raw[offset + 1 + x * 3 + 1] = 0x98; // G
      raw[offset + 1 + x * 3 + 2] = 0x8B; // B
    }
  }
  const compressed = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeB, data]);
  const crc = crc32(crcInput);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
    }
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

fs.writeFileSync('public/favicon-32x32.png', createPng(32, 32));
fs.writeFileSync('public/favicon-16x16.png', createPng(16, 16));
fs.writeFileSync('public/favicon.ico', createPng(32, 32));
console.log('Favicon PNGs and ICO created');

// PWA + social assets (SPEC-004): sizes must match manifest.webmanifest declarations.
fs.writeFileSync('public/icon-192x192.png', createPng(192, 192));
fs.writeFileSync('public/icon-512x512.png', createPng(512, 512));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180));
fs.writeFileSync('public/og-image.png', createPng(1200, 630));
console.log('PWA icons and og-image created');
