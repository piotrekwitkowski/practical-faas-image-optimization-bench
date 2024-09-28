import { readFileSync } from 'fs';
import { cpus, totalmem } from 'os';
import sharp from 'sharp'

const coldStartTime = Date.now();
const environmentId = crypto.randomUUID();
let handlerCount = 0;

export const handler = async () => {
  const handlerStartTime = Date.now();
  handlerCount++;

  // Load image to memory
  const inputImageBuffer = readFileSync('/opt/nodejs/image.jpg');
  const inputImage = sharp(inputImageBuffer);
  const inputMetadata = await inputImage.metadata();
  const outputImage = inputImage.resize(1080).toFormat('jpeg');

  // Process image and store it as Node.js Buffer
  const processingStartTime = Date.now();
  const { info: outputInfo } = await outputImage.toBuffer({ resolveWithObject: true });
  const processingFinishTime = Date.now();

  const response = {
    coldStart: handlerCount === 1,
    durationHandlerStartSinceColdStartMs: handlerStartTime - coldStartTime,
    durationHandlerTotalMs: processingFinishTime - handlerStartTime,
    durationImageLoadingMs: processingStartTime - handlerStartTime,
    durationImageProcessingMs: processingFinishTime - processingStartTime,

    environmentId,
    handlerCount,
    imageId: process.env.IMAGE_ID,

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
    providerMemoryAssociated: process.env.ASSOCIATED_MEMORY_MB,
    providerMemoryAvailable: totalmem() / 1024 / 1024,
    providerName: 'test-aws-lambda',
    providerNodeVersion: process.version,
  }
  return JSON.stringify(response);
}
