import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const SOURCE_ICON = '/mnt/c/Users/jammy/Downloads/Gemini_Generated_Image_7sm2eu7sm2eu7sm2.png';
const ANDROID_RES = join(projectRoot, 'android/app/src/main/res');

const ICON_SIZES = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Foreground sizes (larger for adaptive icon)
const FOREGROUND_SIZES = [
  { folder: 'mipmap-mdpi', size: 108 },
  { folder: 'mipmap-hdpi', size: 162 },
  { folder: 'mipmap-xhdpi', size: 216 },
  { folder: 'mipmap-xxhdpi', size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

async function generateIcons() {
  console.log('Generating Android app icons...');

  for (const { folder, size } of ICON_SIZES) {
    const outputPath = join(ANDROID_RES, folder, 'ic_launcher.png');
    const roundPath = join(ANDROID_RES, folder, 'ic_launcher_round.png');

    // Regular icon
    await sharp(SOURCE_ICON)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    // Round icon (same for now, Android will handle masking)
    await sharp(SOURCE_ICON)
      .resize(size, size)
      .png()
      .toFile(roundPath);

    console.log(`✓ ${folder}: ${size}x${size}`);
  }

  // Generate foreground images
  for (const { folder, size } of FOREGROUND_SIZES) {
    const foregroundPath = join(ANDROID_RES, folder, 'ic_launcher_foreground.png');

    await sharp(SOURCE_ICON)
      .resize(size, size)
      .png()
      .toFile(foregroundPath);

    console.log(`✓ ${folder} foreground: ${size}x${size}`);
  }

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
