import { S3Client } from "@aws-sdk/client-s3";
import { unmarshall } from '@aws-sdk/util-dynamodb';
import assert from 'assert';
import { stringify } from 'csv';
import * as fs from 'fs';
import { S3SyncClient } from 's3-sync-client';
import * as zlib from 'zlib';

const client = new S3Client({});
const { sync } = new S3SyncClient({ client });

let allDatapoints: any[] = [];

const BUCKET_NAME = "aaaa-image-processing";
await sync(`s3://${BUCKET_NAME}`, './s3');

const dynamoDbExports = fs.readdirSync('./s3/AWSDynamoDB').sort();
const lastDynamoDbExportDirname = dynamoDbExports.at(-1);
assert(lastDynamoDbExportDirname !== undefined, 'No DDB exports found in the bucket. Make sure there are some.')
const lastDynamoDbExportTimestamp = Number(lastDynamoDbExportDirname.slice(1, 14));
const lastDynamoDbExportDate = new Date(lastDynamoDbExportTimestamp);
console.log('Last DynamoDB export at', lastDynamoDbExportDate.toLocaleString());

// Unzip DynamoDB export data chunks
const directoryPath = `./s3/AWSDynamoDB/${lastDynamoDbExportDirname}/data`;
const files = fs.readdirSync(directoryPath);
const gzFiles = files.filter(file => file.endsWith('.gz'));
console.log('DynamoDB export files:', gzFiles);

gzFiles.forEach(file => {
  const gzFilePath = `${directoryPath}/${file}`;
  const gzFileContent = fs.readFileSync(gzFilePath);
  const unzippedData = zlib.gunzipSync(gzFileContent).toString();
  const unzippedDataWithoutLastCharacter = unzippedData.slice(0, -1);
  const unzippedDataWithCommas = unzippedDataWithoutLastCharacter.replace(/\n/g, ',');
  const datapointsInDynamoFormat = JSON.parse(`[${unzippedDataWithCommas}]`);
  const unmarshallAndSort = x => Object.fromEntries(Object.entries(unmarshall(x.Item)).sort());
  const datapoints = datapointsInDynamoFormat.map(unmarshallAndSort);
  allDatapoints.push(...datapoints);
});

console.log(allDatapoints.length, 'datapoints loaded in total');
const datapointsSorted = allDatapoints.sort((a, b) => a.timestamp - b.timestamp);

// Export to CSV
stringify(datapointsSorted, { header: true }).pipe(fs.createWriteStream('image-processing-stats.csv'));
