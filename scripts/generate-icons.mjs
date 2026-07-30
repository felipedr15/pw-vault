/**
 * Generate PNG icons from favicon.svg for PWA/Play Store
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install -D sharp
 */
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgPath = resolve(root, 'public/app-icon.svg')
const svg = readFileSync(svgPath)

const sizes = [192, 512]

// Standard icons — just resize the SVG to fit
for (const size of sizes) {
  await sharp(svg, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(root, `public/icon-${size}.png`))
  console.log(`Created icon-${size}.png`)
}

// Maskable icons — add solid background + 10% safe zone padding
for (const size of sizes) {
  const iconSize = Math.round(size * 0.8) // 80% of canvas = 10% padding each side
  const icon = await sharp(svg, { density: 300 })
    .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 10, g: 14, b: 20, alpha: 255 }, // #0a0e14 (terminal dark background)
    },
  })
    .composite([{ input: icon, gravity: 'centre' }])
    .png()
    .toFile(resolve(root, `public/icon-maskable-${size}.png`))
  console.log(`Created icon-maskable-${size}.png`)
}

console.log('\nDone! Icons saved to public/')
