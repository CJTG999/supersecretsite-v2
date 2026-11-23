// Dependency-free generator for WebDuku's app icons and iOS splash screens.
// Usage (from the project folder):  node tools/generate-assets.mjs
// It writes icons/*.png and splash/*.png, and refreshes the <link rel="apple-touch-startup-image"> block
// in index.html between the SPLASH:START / SPLASH:END markers. Edit the constants below to restyle.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEMES = {
  icon:  { bg: [47, 59, 82],   fg: [243, 243, 246] },   // app icon: slate tile, pale blocks
  light: { bg: [243, 243, 246], fg: [47, 59, 82] },     // splash (matches the light theme)
  dark:  { bg: [16, 18, 22],    fg: [223, 227, 238] },  // splash (matches the dark theme)
};
const FILLED = [[1, 0, 0], [1, 0, 0], [1, 1, 1]];       // the "big corner" piece is lit, the rest is ghosted
const GHOST_MIX = 0.2, GAP = 0.14, RADIUS = 0.24, SS = 3; // ghost strength, gap/cell, corner/cell, antialias grid

// iPhone portrait splash sizes: [css width, css height, device pixel ratio]
const DEVICES = [
  [440, 956, 3], [430, 932, 3], [420, 912, 3], [402, 874, 3], [393, 852, 3], [428, 926, 3],
  [390, 844, 3], [414, 896, 3], [414, 896, 2], [375, 812, 3], [375, 667, 2], [414, 736, 3],
];

// ---- minimal PNG encoder (8-bit RGB) ----
const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
function encodePNG(w, h, raw) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---- rasterizer: flat background + a centered 3x3 block grid, 3x3 supersampled ----
function render(W, H, theme, gridFrac) {
  const { bg, fg } = theme, ghost = bg.map((v, i) => v + (fg[i] - v) * GHOST_MIX);
  const stride = 1 + W * 3, raw = Buffer.alloc(H * stride);
  for (let y = 0; y < H; y++) { const o = y * stride; for (let x = 0; x < W; x++) { const i = o + 1 + x * 3; raw[i] = bg[0]; raw[i + 1] = bg[1]; raw[i + 2] = bg[2]; } }
  const gridPx = gridFrac * Math.min(W, H), cell = gridPx / (3 + 2 * GAP), pitch = cell * (1 + GAP), r = cell * RADIUS;
  const ox = (W - gridPx) / 2, oy = (H - gridPx) / 2;
  const sample = (px, py) => {
    const gx = px - ox, gy = py - oy; if (gx < 0 || gy < 0) return bg;
    const col = Math.floor(gx / pitch), row = Math.floor(gy / pitch); if (col > 2 || row > 2) return bg;
    const lx = gx - col * pitch, ly = gy - row * pitch; if (lx > cell || ly > cell) return bg;
    const cx = lx < r ? r : lx > cell - r ? cell - r : lx, cy = ly < r ? r : ly > cell - r ? cell - r : ly;
    if ((lx - cx) ** 2 + (ly - cy) ** 2 > r * r) return bg;
    return FILLED[row][col] ? fg : ghost;
  };
  const x0 = Math.max(0, Math.floor(ox) - 1), x1 = Math.min(W - 1, Math.ceil(ox + gridPx) + 1);
  const y0 = Math.max(0, Math.floor(oy) - 1), y1 = Math.min(H - 1, Math.ceil(oy + gridPx) + 1);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let R = 0, G = 0, B = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) { const c = sample(x + (sx + .5) / SS, y + (sy + .5) / SS); R += c[0]; G += c[1]; B += c[2]; }
    const i = y * stride + 1 + x * 3, n = SS * SS;
    raw[i] = Math.round(R / n); raw[i + 1] = Math.round(G / n); raw[i + 2] = Math.round(B / n);
  }
  return encodePNG(W, H, raw);
}
const out = (rel, buf) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); console.log(rel, (buf.length / 1024).toFixed(1) + ' KB'); };

// ---- app icons (opaque, full-bleed: iOS / Android apply their own corner masks) ----
out('icons/apple-touch-icon.png', render(180, 180, THEMES.icon, 0.6));
out('icons/icon-192.png', render(192, 192, THEMES.icon, 0.6));
out('icons/icon-512.png', render(512, 512, THEMES.icon, 0.6));
out('icons/maskable-512.png', render(512, 512, THEMES.icon, 0.52));   // smaller mark = inside the maskable safe zone
out('icons/favicon-32.png', render(32, 32, THEMES.icon, 0.72));

// ---- iOS splash screens (light + dark per device) and their <link> tags ----
const links = [];
for (const [w, h, dpr] of DEVICES) for (const scheme of ['light', 'dark']) {
  const file = `${scheme}-${w * dpr}x${h * dpr}.png`;
  out('splash/' + file, render(w * dpr, h * dpr, THEMES[scheme], 0.22));
  links.push(`<link rel="apple-touch-startup-image" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait) and (prefers-color-scheme: ${scheme})" href="splash/${file}">`);
}
const htmlPath = path.join(root, 'index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const re = /<!-- SPLASH:START[^>]*-->[\s\S]*?<!-- SPLASH:END -->/;
  if (!re.test(html)) throw new Error('SPLASH markers not found in index.html');
  fs.writeFileSync(htmlPath, html.replace(re, () => `<!-- SPLASH:START (generated by tools/generate-assets.mjs) -->\n${links.join('\n')}\n<!-- SPLASH:END -->`));
  console.log('index.html splash links updated (' + links.length + ')');
}
