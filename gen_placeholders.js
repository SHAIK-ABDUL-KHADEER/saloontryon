const fs = require('fs');
const path = require('path');

function createSVG(label, icon, gradFrom, gradTo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradFrom}"/>
      <stop offset="100%" style="stop-color:${gradTo}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" style="stop-color:rgba(200,164,94,0.2)"/>
      <stop offset="100%" style="stop-color:transparent"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect width="400" height="400" fill="url(#glow)"/>
  <circle cx="200" cy="150" r="80" fill="none" stroke="rgba(200,164,94,0.12)" stroke-width="1"/>
  <text x="200" y="175" text-anchor="middle" font-size="72">${icon}</text>
  <text x="200" y="265" text-anchor="middle" font-family="Georgia,serif" font-size="26" font-weight="bold" fill="rgba(240,240,240,0.9)">${label}</text>
  <line x1="140" y1="290" x2="260" y2="290" stroke="rgba(200,164,94,0.3)" stroke-width="1"/>
</svg>`;
}

const hairDir = path.join(__dirname, 'public', 'styles', 'hairstyles');
const beardDir = path.join(__dirname, 'public', 'styles', 'beards');

const newHairstyles = [
  ['man_bun', 'Man Bun', '💇', '#0d0d0d', '#1a1510'],
  ['mohawk', 'Mohawk', '🦅', '#0d0d0d', '#151015'],
  ['curtain_bangs', 'Curtain Bangs', '🎭', '#0d0d0d', '#101518'],
  ['french_crop', 'French Crop', '✂️', '#0d0d0d', '#150d10'],
  ['taper_fade', 'Taper Fade', '📐', '#0d0d0d', '#10150d'],
  ['side_part', 'Side Part', '💈', '#0d0d0d', '#0d1015'],
  ['afro', 'Afro', '🌀', '#0d0d0d', '#151510'],
];

const newBeards = [
  ['chin_strap', 'Chin Strap', '✦', '#0d0d0d', '#1a1510'],
  ['circle_beard', 'Circle Beard', '⭕', '#0d0d0d', '#101518'],
  ['handlebar', 'Handlebar', '〰️', '#0d0d0d', '#150d10'],
  ['balbo', 'Balbo', '◆', '#0d0d0d', '#10150d'],
  ['anchor_beard', 'Anchor', '⚓', '#0d0d0d', '#0d1015'],
  ['ducktail', 'Ducktail', '🦆', '#0d0d0d', '#151510'],
  ['short_boxed', 'Short Boxed', '▬', '#0d0d0d', '#151015'],
  ['bandholz', 'Bandholz', '🧔', '#0d0d0d', '#0d1510'],
  ['chevron', 'Chevron Mustache', '🔻', '#0d0d0d', '#100d15'],
  ['soul_patch', 'Soul Patch', '▪', '#0d0d0d', '#15100d'],
];

newHairstyles.forEach(([id, name, icon, g1, g2]) => {
  const svgPath = path.join(hairDir, id + '.svg');
  if (!fs.existsSync(svgPath)) {
    fs.writeFileSync(svgPath, createSVG(name, icon, g1, g2));
    console.log('Created:', svgPath);
  }
});

newBeards.forEach(([id, name, icon, g1, g2]) => {
  const svgPath = path.join(beardDir, id + '.svg');
  if (!fs.existsSync(svgPath)) {
    fs.writeFileSync(svgPath, createSVG(name, icon, g1, g2));
    console.log('Created:', svgPath);
  }
});

console.log('Done!');
