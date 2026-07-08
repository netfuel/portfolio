// Media pipeline — converts source JPEGs to right-sized WebP.
// Run after adding new imagery:  node scripts/optimize-images.mjs
// Commits the .webp files; source .jpg files can then be removed.

import { readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

// dir → { maxWidth, quality } — sized to the largest rendered box (×2 dpr)
const RULES = [
  { dir: "public/images/work", maxWidth: 1400, quality: 78 },
  { dir: "public/images/flyers", maxWidth: 640, quality: 70 },
];

// Single files worth converting outside the directory rules
const FILES = [{ file: "public/images/headshot.jpg", maxWidth: 600, quality: 80 }];

const kb = (n) => (n / 1024).toFixed(0) + "KB";

const convert = async (file, { maxWidth, quality }) => {
  if (extname(file).toLowerCase() !== ".jpg") return;
  const out = file.replace(/\.jpg$/i, ".webp");
  const src = sharp(file);
  const meta = await src.metadata();
  const { size } = await src
    .resize({ width: Math.min(meta.width, maxWidth), withoutEnlargement: true })
    .webp({ quality })
    .toFile(out);
  console.log(`${basename(file)} → ${basename(out)}  ${kb(size)}`);
};

for (const rule of RULES) {
  for (const name of await readdir(rule.dir)) {
    await convert(join(rule.dir, name), rule);
  }
}
for (const { file, ...rule } of FILES) {
  await convert(file, rule);
}
