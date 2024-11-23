import { http } from '@google-cloud/functions-framework';
import { readFileSync } from 'fs';
import { cpus, totalmem } from 'os';
import sharp from 'sharp'

const coldStartTime = Date.now();
const environmentId = crypto.randomUUID();
const format = process.env.OUTPUT_FORMAT;
const width = Number(process.env.OUTPUT_WIDTH);
let handlerCount = 0;

http('handler', async (_, res) => {
  const handlerStartTime = Date.now();
  handlerCount++;
  
  // Load image to memory
  const inputImageBuffer = readFileSync('/workspace/image.jpg');
  const inputImage = sharp(inputImageBuffer);
  const inputMetadata = await inputImage.metadata();
  const outputImage = inputImage.resize(width).toFormat(format);

  // Process image and store it as Node.js Buffer
  const processingStartTime = Date.now();
  const { info: outputInfo, data } = await outputImage.toBuffer({ resolveWithObject: true });
  const processingFinishTime = Date.now();

  const response = {
    coldStart: handlerCount === 1,
    durationHandlerStartSinceColdStartMs: handlerStartTime - coldStartTime,
    durationHandlerTotalMs: processingFinishTime - handlerStartTime,
    durationImageLoadingMs: processingStartTime - handlerStartTime,
    durationImageProcessingMs: processingFinishTime - processingStartTime,

    environmentId,
    handlerCount,
    imageName: process.env.IMAGE_NAME,

    inputBytes: inputMetadata.size,
    inputFormat: inputMetadata.format,
    inputHeight: inputMetadata.height,
    inputWidth: inputMetadata.width,

    outputBytes: outputInfo.size,
    outputFormat: outputInfo.format,
    outputHeight: outputInfo.height,
    outputWidth: outputInfo.width,

    providerArch: process.arch,
    providerCpus: cpus().length,
    providerMemoryAssociated: process.env.MEMORY_SIZE,
    providerMemoryAvailable: totalmem() / 1024 / 1024,
    providerName: 'gcp-cloud-functions',
    providerNodeVersion: process.version,
    zBase64: data.toString('base64'),
  }
  res.send(response);
})
