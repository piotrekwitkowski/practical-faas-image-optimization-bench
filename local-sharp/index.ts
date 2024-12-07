import { readFileSync } from "fs";
import sharp from "sharp";

const file = readFileSync('./image.jpeg');
const width = 600;
const format = 'avif';

const image = sharp(file).resize(width).toFormat(format);
sharp.cache(false);


let start, end;

start = performance.now();
for (let i = 0; i < 2; i++) {
  console.log(i);
  // console.log(process.memoryUsage());
  console.log(await image.toFile('/dev/null'));
}
end = performance.now();
console.log('diff:', end - start);


start = performance.now();
for (let i = 0; i < 2; i++) {
  console.log(i);
  // console.log(process.memoryUsage());
  console.log(await image.toFile('/tmp/sharp_out'));
}
end = performance.now();
console.log('diff:', end - start);


start = performance.now();
for (let i = 0; i < 20; i++) {
  console.log(i);
  // console.log(process.memoryUsage());
  await image.toBuffer();
}
end = performance.now();
console.log('diff:', end - start);


