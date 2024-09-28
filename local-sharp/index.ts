import { createReadStream, createWriteStream, readFileSync } from "fs";
import sharp from "sharp";

const width = 1024;
const format = 'jpeg';
const outputFilepath = (id:string) => `${Date.now()}_${width}${id}.${format}`;

let now = performance.now();
for (let i = 0; i < 1000; i++) {
  await sharp(readFileSync('./image.jpeg'))
  .resize(width)
  .toFile(outputFilepath('f'));
}
console.log(performance.now() - now)


now = performance.now();
createReadStream('./image.jpeg')
  .pipe(sharp().resize(width))
  .pipe(createWriteStream(outputFilepath('s')))
  .on('close', () => console.log(performance.now() - now));
