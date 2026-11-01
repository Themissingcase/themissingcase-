import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// SVG with high aesthetic quality: Victorian brass magnifying glass, gold monogram & filigree, dark obsidian backdrop
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#231F1A" />
      <stop offset="60%" stop-color="#141210" />
      <stop offset="100%" stop-color="#0A0908" />
    </radialGradient>

    <!-- Antique Gold Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F4E0A5" />
      <stop offset="25%" stop-color="#D9B878" />
      <stop offset="50%" stop-color="#C5A059" />
      <stop offset="75%" stop-color="#8C6D46" />
      <stop offset="100%" stop-color="#5E472C" />
    </linearGradient>

    <!-- Bright Gold Highlight -->
    <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF5D6" />
      <stop offset="50%" stop-color="#D9B878" />
      <stop offset="100%" stop-color="#9E7836" />
    </linearGradient>

    <!-- Glass Lens Reflection -->
    <linearGradient id="lensGrad" x1="20%" y1="15%" x2="80%" y2="85%">
      <stop offset="0%" stop-color="#D9B878" stop-opacity="0.32" />
      <stop offset="30%" stop-color="#6BB0C9" stop-opacity="0.18" />
      <stop offset="70%" stop-color="#152636" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#0D1620" stop-opacity="0.75" />
    </linearGradient>

    <!-- Glint Gradient -->
    <linearGradient id="glint" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8" />
      <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <!-- Crimson Wax Accent -->
    <radialGradient id="crimsonGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#DE3B3B" />
      <stop offset="50%" stop-color="#9E2A2B" />
      <stop offset="100%" stop-color="#4F0E10" />
    </radialGradient>

    <!-- Drop Shadows -->
    <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.8" />
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Base Canvas -->
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)" />

  <!-- Outer Ornate Filigree Victorian Ring -->
  <circle cx="256" cy="256" r="236" fill="none" stroke="url(#goldGrad)" stroke-width="3" opacity="0.45" stroke-dasharray="14 8" />
  <circle cx="256" cy="256" r="226" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" opacity="0.6" />

  <!-- Decorative Corner Accents -->
  <g stroke="url(#goldGrad)" stroke-width="2" fill="none" opacity="0.5">
    <path d="M 64 100 A 36 36 0 0 1 100 64" />
    <circle cx="100" cy="100" r="3" fill="#D9B878" />
    <path d="M 448 100 A 36 36 0 0 0 412 64" />
    <circle cx="412" cy="100" r="3" fill="#D9B878" />
    <path d="M 64 412 A 36 36 0 0 0 100 448" />
    <circle cx="100" cy="412" r="3" fill="#D9B878" />
    <path d="M 448 412 A 36 36 0 0 1 412 448" />
    <circle cx="412" cy="412" r="3" fill="#D9B878" />
  </g>

  <!-- Wax Seal Emblem at bottom right of frame -->
  <g filter="url(#shadow)">
    <circle cx="370" cy="365" r="46" fill="url(#crimsonGrad)" />
    <circle cx="370" cy="365" r="38" fill="none" stroke="#FFA3A3" stroke-width="1.5" opacity="0.4" />
    <!-- Mini Skull / Detective Key mark on seal -->
    <path d="M 370 348 C 362 348 356 354 356 362 C 356 367 359 371 364 374 L 364 382 L 370 380 L 376 382 L 376 374 C 381 371 384 367 384 362 C 384 354 378 348 370 348 Z" fill="#FFA3A3" opacity="0.85" />
    <circle cx="366" cy="361" r="2" fill="#4F0E10" />
    <circle cx="374" cy="361" r="2" fill="#4F0E10" />
  </g>

  <!-- Large Antique Brass Magnifying Glass -->
  <g filter="url(#shadow)">
    <!-- Wooden / Brass Turned Handle -->
    <g transform="rotate(42 225 225)">
      <!-- Handle Shadow & Body -->
      <path d="M 215 325 L 235 325 L 230 435 C 230 446 220 452 215 452 C 210 452 200 446 200 435 Z" fill="#20150F" stroke="url(#goldGrad)" stroke-width="2.5" />
      <rect x="207" y="320" width="16" height="32" rx="4" fill="url(#goldHighlight)" stroke="#5E472C" stroke-width="1" />
      <rect x="204" y="348" width="22" height="6" rx="2" fill="url(#goldGrad)" />
      <!-- Handle ridges -->
      <line x1="205" y1="375" x2="225" y2="375" stroke="url(#goldGrad)" stroke-width="2" />
      <line x1="206" y1="395" x2="224" y2="395" stroke="url(#goldGrad)" stroke-width="2" />
      <line x1="208" y1="415" x2="222" y2="415" stroke="url(#goldGrad)" stroke-width="2" />
      <!-- Pommel -->
      <circle cx="215" cy="445" r="9" fill="url(#goldHighlight)" />
      <circle cx="215" cy="445" r="4" fill="#3D2918" />
    </g>

    <!-- Glass Rim (Heavy Cast Brass with Engravings) -->
    <circle cx="218" cy="210" r="126" fill="none" stroke="url(#goldGrad)" stroke-width="18" />
    <circle cx="218" cy="210" r="135" fill="none" stroke="#FFF0C2" stroke-width="2" opacity="0.75" />
    <circle cx="218" cy="210" r="117" fill="none" stroke="#5E472C" stroke-width="2.5" />

    <!-- Interior Glass Lens -->
    <circle cx="218" cy="210" r="116" fill="url(#lensGrad)" />

    <!-- Magnified Secret Under Lens: Ornate Lettering "MC" and The Clue Key -->
    <g id="magnified-content">
      <!-- Compass / Clue Dial Grid -->
      <circle cx="218" cy="210" r="88" fill="none" stroke="#D9B878" stroke-width="1" stroke-dasharray="6 4" opacity="0.35" />
      <circle cx="218" cy="210" r="62" fill="none" stroke="#D9B878" stroke-width="0.8" opacity="0.25" />
      <line x1="218" y1="124" x2="218" y2="296" stroke="#D9B878" stroke-width="1" stroke-dasharray="3 5" opacity="0.3" />
      <line x1="132" y1="210" x2="304" y2="210" stroke="#D9B878" stroke-width="1" stroke-dasharray="3 5" opacity="0.3" />

      <!-- Ornate Victorian Monogram "M · C" (The Missing Clue) -->
      <text x="218" y="206" font-family="'Cinzel Decorative', 'Playfair Display', Georgia, serif" font-size="58" font-weight="bold" fill="url(#goldHighlight)" text-anchor="middle" letter-spacing="4" filter="url(#glow)">M·C</text>

      <!-- Subtext / Secret Banner -->
      <text x="218" y="240" font-family="'Cinzel Decorative', 'Playfair Display', Georgia, serif" font-size="13" font-weight="600" fill="#E8D5B5" text-anchor="middle" letter-spacing="3.5" opacity="0.95">VERITAS</text>

      <!-- Key Silhouette beneath -->
      <path d="M 204 256 C 204 252 208 249 213 249 C 218 249 222 252 222 256 C 222 258 221 260 219 261 L 219 274 L 225 274 L 225 277 L 219 277 L 219 281 L 224 281 L 224 284 L 217 284 L 217 261 C 215 260 214 258 214 256 Z" fill="url(#goldHighlight)" />
    </g>

    <!-- Curved Lens Glare / Specular Reflection -->
    <path d="M 140 160 A 105 105 0 0 1 270 125 A 108 108 0 0 0 162 230 A 105 105 0 0 1 140 160 Z" fill="url(#glint)" />
    <ellipse cx="268" cy="144" rx="28" ry="12" transform="rotate(-30 268 144)" fill="#FFFFFF" opacity="0.35" />
  </g>

  <!-- Title Ribbon at Top Bottom border -->
  <text x="256" y="478" font-family="'Cinzel Decorative', 'Playfair Display', Georgia, serif" font-size="20" font-weight="bold" fill="#D9B878" text-anchor="middle" letter-spacing="4" opacity="0.9">THE MISSING CLUE</text>
</svg>`;

// Maskable SVG has extra safety padding (15% padding on all sides) and solid background to full edges
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="mBgGrad" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#231F1A" />
      <stop offset="65%" stop-color="#141210" />
      <stop offset="100%" stop-color="#0A0908" />
    </radialGradient>
    <linearGradient id="mGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F4E0A5" />
      <stop offset="30%" stop-color="#D9B878" />
      <stop offset="70%" stop-color="#C5A059" />
      <stop offset="100%" stop-color="#73542C" />
    </linearGradient>
    <linearGradient id="mGoldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF5D6" />
      <stop offset="50%" stop-color="#D9B878" />
      <stop offset="100%" stop-color="#9E7836" />
    </linearGradient>
    <linearGradient id="mLensGrad" x1="20%" y1="15%" x2="80%" y2="85%">
      <stop offset="0%" stop-color="#D9B878" stop-opacity="0.3" />
      <stop offset="40%" stop-color="#5590A8" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#0B131C" stop-opacity="0.8" />
    </linearGradient>
    <linearGradient id="mGlint" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="mCrimsonGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#DE3B3B" />
      <stop offset="60%" stop-color="#9E2A2B" />
      <stop offset="100%" stop-color="#4F0E10" />
    </radialGradient>
    <filter id="mShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.9" />
    </filter>
  </defs>

  <!-- Full-bleed background for maskable cropping -->
  <rect width="512" height="512" fill="url(#mBgGrad)" />

  <!-- Scaled content centered strictly inside 75% safe area (radius <= 190px from center 256,256) -->
  <g transform="translate(256, 256) scale(0.72) translate(-256, -240)">
    <!-- Ornate Filigree Ring -->
    <circle cx="256" cy="240" r="236" fill="none" stroke="url(#mGoldGrad)" stroke-width="3" opacity="0.5" stroke-dasharray="14 8" />
    <circle cx="256" cy="240" r="226" fill="none" stroke="url(#mGoldGrad)" stroke-width="1.8" opacity="0.65" />

    <!-- Wax Seal Emblem -->
    <g filter="url(#mShadow)">
      <circle cx="366" cy="350" r="42" fill="url(#mCrimsonGrad)" />
      <circle cx="366" cy="350" r="35" fill="none" stroke="#FFA3A3" stroke-width="1.5" opacity="0.4" />
      <path d="M 366 335 C 359 335 353 341 353 348 C 353 353 356 356 360 359 L 360 367 L 366 365 L 372 367 L 372 359 C 376 356 379 353 379 348 C 379 341 373 335 366 335 Z" fill="#FFA3A3" opacity="0.85" />
    </g>

    <!-- Brass Magnifying Glass -->
    <g filter="url(#mShadow)">
      <g transform="rotate(42 225 210)">
        <path d="M 215 310 L 235 310 L 230 420 C 230 430 220 436 215 436 C 210 436 200 430 200 420 Z" fill="#20150F" stroke="url(#mGoldGrad)" stroke-width="2.5" />
        <rect x="207" y="305" width="16" height="30" rx="4" fill="url(#mGoldHighlight)" stroke="#5E472C" stroke-width="1" />
        <rect x="204" y="332" width="22" height="6" rx="2" fill="url(#mGoldGrad)" />
        <circle cx="215" cy="430" r="9" fill="url(#mGoldHighlight)" />
      </g>

      <!-- Glass Rim -->
      <circle cx="218" cy="195" r="126" fill="none" stroke="url(#mGoldGrad)" stroke-width="18" />
      <circle cx="218" cy="195" r="135" fill="none" stroke="#FFF0C2" stroke-width="2" opacity="0.75" />
      <circle cx="218" cy="195" r="117" fill="none" stroke="#5E472C" stroke-width="2.5" />

      <!-- Interior Lens -->
      <circle cx="218" cy="195" r="116" fill="url(#mLensGrad)" />

      <!-- Center Monogram -->
      <circle cx="218" cy="195" r="88" fill="none" stroke="#D9B878" stroke-width="1" stroke-dasharray="6 4" opacity="0.35" />
      <text x="218" y="195" font-family="'Cinzel Decorative', 'Playfair Display', Georgia, serif" font-size="58" font-weight="bold" fill="url(#mGoldHighlight)" text-anchor="middle" letter-spacing="4">M·C</text>
      <text x="218" y="228" font-family="'Cinzel Decorative', 'Playfair Display', Georgia, serif" font-size="14" font-weight="600" fill="#E8D5B5" text-anchor="middle" letter-spacing="3.5">VERITAS</text>

      <!-- Glare -->
      <path d="M 140 145 A 105 105 0 0 1 270 110 A 108 108 0 0 0 162 215 A 105 105 0 0 1 140 145 Z" fill="url(#mGlint)" />
    </g>

    <!-- Bottom label -->
    <text x="256" y="470" font-family="'Cinzel Decorative', 'Playfair Display', Georgia, serif" font-size="22" font-weight="bold" fill="#D9B878" text-anchor="middle" letter-spacing="4">THE MISSING CLUE</text>
  </g>
</svg>`;

async function run() {
  console.log('Writing public/icon.svg...');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);

  console.log('Generating pwa-512x512.png...');
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  console.log('Generating pwa-192x192.png...');
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  console.log('Generating pwa-maskable-512x512.png...');
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Generating apple-touch-icon.png (180x180)...');
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating favicon.png (64x64) and favicon.ico...');
  const faviconBuffer = await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png({ quality: 100 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), faviconBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconBuffer);

  console.log('All icons generated successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
