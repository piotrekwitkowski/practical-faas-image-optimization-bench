import { http } from '@google-cloud/functions-framework';
import { readFileSync } from 'fs';
import { cpus, totalmem } from 'os';
import sharp from 'sharp'

const coldStartTime = Date.now();
const environmentId = crypto.randomUUID();
const inputImageBuffer = readFileSync('/workspace/image.jpg');
const format = process.env.OUTPUT_FORMAT;
const width = Number(process.env.OUTPUT_WIDTH);
let handlerCount = 0;

// Disable libvips cache and set up image processing with Sharp
// https://sharp.pixelplumbing.com/api-utility
sharp.cache(false);
const sharpImage = sharp(inputImageBuffer).resize(width).toFormat(format);

http('main', async (req, res) => {
  handlerCount++;
  
  const { size: inputBytes, format: inputFormat, height: inputHeight, width: inputWidth } = await sharpImage.metadata();
  const processingStartTime = Date.now();
  const { size: outputBytes, format: outputFormat, height: outputHeight, width: outputWidth } = await sharpImage.toFile('/dev/null');
  const processingFinishTime = Date.now();

  const response = {
    coldStart: Boolean(handlerCount === 1),
    durationSinceColdStartMs: processingStartTime - coldStartTime,
    durationProcessingMs: processingFinishTime - processingStartTime,

    environmentId,
    handlerCount,
    imageName: process.env.IMAGE_NAME,

    inputBytes,
    inputFormat,
    inputHeight,
    inputWidth,
    outputBytes,
    outputFormat,
    outputHeight,
    outputWidth,

    providerArch: process.arch,
    providerCpus: cpus().length,
    providerMemoryAssociated: process.env.MEMORY_SIZE,
    providerMemoryAvailable: totalmem() / 1024 / 1024,
    providerMemoryUsageRss: process.memoryUsage().rss,
    providerName: 'gcp',
    providerNodeVersion: process.version,
  }
  res.send(response);
})
