const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const iconsDir = path.join(process.cwd(), "src-tauri", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createValidPNG(width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const cx = x - width / 2;
      const cy = y - height / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const maxR = width * 0.46;

      if (dist < maxR) {
        if (dist > maxR * 0.75 && dist < maxR * 0.88) {
          raw[offset++] = 6;
          raw[offset++] = 182;
          raw[offset++] = 212;
          raw[offset++] = 255;
        } else if (dist < maxR * 0.38) {
          raw[offset++] = 59;
          raw[offset++] = 130;
          raw[offset++] = 246;
          raw[offset++] = 255;
        } else {
          raw[offset++] = 15;
          raw[offset++] = 23;
          raw[offset++] = 42;
          raw[offset++] = 255;
        }
      } else {
        raw[offset++] = 0;
        raw[offset++] = 0;
        raw[offset++] = 0;
        raw[offset++] = 0;
      }
    }
  }

  const idatData = zlib.deflateSync(raw);
  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", idatData);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const png256 = createValidPNG(256, 256);
const png128 = createValidPNG(128, 128);
const png32 = createValidPNG(32, 32);

fs.writeFileSync(path.join(iconsDir, "icon.png"), png256);
fs.writeFileSync(path.join(iconsDir, "32x32.png"), png32);
fs.writeFileSync(path.join(iconsDir, "128x128.png"), png128);
fs.writeFileSync(path.join(iconsDir, "128x128@2x.png"), png256);

const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);

const icoEntry = Buffer.alloc(16);
icoEntry.writeUInt8(0, 0); // 0 indicates 256px
icoEntry.writeUInt8(0, 1);
icoEntry.writeUInt8(0, 2);
icoEntry.writeUInt8(0, 3);
icoEntry.writeUInt16LE(1, 4);
icoEntry.writeUInt16LE(32, 6);
icoEntry.writeUInt32LE(png256.length, 8);
icoEntry.writeUInt32LE(22, 12);

const icoFile = Buffer.concat([icoHeader, icoEntry, png256]);
fs.writeFileSync(path.join(iconsDir, "icon.ico"), icoFile);

fs.writeFileSync(path.join(iconsDir, "Square30x30Logo.png"), png32);
fs.writeFileSync(path.join(iconsDir, "Square44x44Logo.png"), png32);
fs.writeFileSync(path.join(iconsDir, "Square71x71Logo.png"), png128);
fs.writeFileSync(path.join(iconsDir, "Square89x89Logo.png"), png128);
fs.writeFileSync(path.join(iconsDir, "Square107x107Logo.png"), png128);
fs.writeFileSync(path.join(iconsDir, "Square142x142Logo.png"), png128);
fs.writeFileSync(path.join(iconsDir, "Square150x150Logo.png"), png128);
fs.writeFileSync(path.join(iconsDir, "Square284x284Logo.png"), png256);
fs.writeFileSync(path.join(iconsDir, "Square310x310Logo.png"), png256);
fs.writeFileSync(path.join(iconsDir, "StoreLogo.png"), png128);

console.log("Successfully generated all required icons in src-tauri/icons/");
