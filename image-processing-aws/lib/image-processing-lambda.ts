import { cpus, totalmem } from 'os';
const coldStartTime = Date.now();
const executionEnvironmentId = crypto.randomUUID();
let handlerCount = 0;

export const handler = async () => {
  handlerCount++;
  const startTime = Date.now();
  // TODO: optimize image

  const finishTime = Date.now();
  const response = {
    executionEnvironmentId,
    handlerCount,
    imageId: process.env.IMAGE_ID,

    originalBytes: 0,
    originalHeight: 0,
    originalWidth: 0,

    processedBytes: 0,
    processedHeight: 0,
    processedWidth: 0,

    providerArch: process.arch,
    providerCpus: cpus().length,
    providerMemoryAssociated: process.env.ASSOCIATED_MEMORY_MB,
    providerMemoryAvailable: totalmem() / 1024 / 1024,
    providerName: 'test-aws-lambda',
    providerNodeVersion: process.version,
    timeSinceStartMs: finishTime - startTime,
    timeSinceColdStartMs: finishTime - coldStartTime,
    wasColdStart: handlerCount === 1,
  }
  return JSON.stringify(response);
}
