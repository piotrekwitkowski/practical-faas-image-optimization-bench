import { readFileSync } from "fs";
import sharp from "sharp";

const file = readFileSync('./image.jpeg');
const width = 600;
const format = 'avif';

const image = sharp(file).resize(width).toFormat(format);
sharp.cache({ items: 50 });

for (let i = 0; i < 20; i++) {
  console.log(process.memoryUsage());
  await image.toFile('/dev/null');
}
