const fs = require('fs');
const path = require('path');

// Mock module imports so we can print the watermark filter

// We will read getWatermarkFilter function from lib/video-preview.ts using a regex or run it by requiring
// Wait, we can run it using require since we are running in node
// Since node doesn't load typescript, we can compile it first or read the file and extract the function.
// Let's just read lib/video-preview.ts and eval getWatermarkFilter and its dependencies!
const code = fs.readFileSync(path.join(__dirname, '..', 'lib', 'video-preview.ts'), 'utf8');

// Simple eval mock
const getFontPath = () => {
  const winFont = 'C:\\Windows\\Fonts\\arial.ttf';
  if (fs.existsSync(winFont)) return winFont;
  return null;
};

const getEscapedFontFileParam = () => {
  const fontPath = getFontPath();
  if (!fontPath) return '';
  const localFontName = 'delt_temp_font.ttf';
  return `:fontfile='${localFontName}'`;
};

function getWatermarkFilter() {
  const text = 'DELT PREVIEW';
  const fontSize = 18;
  const stepX = 220;
  const stepY = 120;
  const fontParam = getEscapedFontFileParam();

  const drawtextFilters = [];
  for (let y = 30; y < 480; y += stepY) {
    const isEven = Math.round(y / stepY) % 2 === 0;
    const xOffset = isEven ? 0 : Math.round(stepX / 2);
    for (let x = 30; x < 854; x += stepX) {
      const escapedText = text.replace(/'/g, "'\\\\\\''").replace(/:/g, '\\\\:');
      drawtextFilters.push(
        `drawtext=text='${escapedText}':fontcolor=0x464646@0.0:borderw=1.5:bordercolor=0x464646@0.35:fontsize=${fontSize}${fontParam}:x=${x + xOffset}:y=${y}`
      );
    }
  }
  return drawtextFilters.join(',');
}

console.log('Generated filter graph:');
console.log(getWatermarkFilter().slice(0, 500) + '...');
