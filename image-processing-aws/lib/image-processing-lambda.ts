export const handler = async () => {
  const response = {
    imageId: process.env.IMAGE_ID,
    
    originalBytes: 0,
    originalHeight: 0,
    originalWidth: 0,
    
    processedBytes: 0,
    processedHeight: 0,
    processedWidth: 0,

    provider: 'test-aws-lambda',
    totalExecutionTime: 0,
  }
  return JSON.stringify(response);
}
