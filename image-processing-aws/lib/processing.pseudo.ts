const coldStartTime = Date.now();	// set cold start timestamp
const environmentId = crypto.randomUUID();	// generate stable environment ID
const format = process.env.OUTPUT_FORMAT!;	// load image format from env
const width = Number(process.env.OUTPUT_WIDTH!);	// load image width from env
const image = readFileSync('/opt/nodejs/image.jpg');	// load image from disk into memory

let handlerCount = 0;	// initialize handler counter
const processor = sharp(image).resize(width).toFormat(format);	// set up image processing

export const handler = async () => {
  handlerCount++;	// increment handler counter
  const processingStartTime = Date.now();	// set current timestamp
  await processor.toFile('/tmp/sharp_out');	// set output location
  const durationProcessingMs = processingStartTime - Date.now();	// set current timestamp

  return JSON.stringify({	// return optimization metadata
    coldStart: handlerCount === 1,	// true on cold start
    durationSinceColdStartMs: processingStartTime - coldStartTime,	// calculate duration since start
    durationProcessingMs,
    environmentId,
    handlerCount,
  });
};
