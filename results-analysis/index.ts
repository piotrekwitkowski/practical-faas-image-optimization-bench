import { S3Client } from "@aws-sdk/client-s3";
import { unmarshall } from '@aws-sdk/util-dynamodb';
import assert from 'assert';
import { stringify } from 'csv-stringify/sync';
import * as fs from 'fs';
import { S3SyncClient } from 's3-sync-client';
import * as zlib from 'zlib';

const client = new S3Client({});
const { sync } = new S3SyncClient({ client });

let allDatapoints: any[] = [];

// const BUCKET_NAME = 'practical-faas-image-optimization-bench-results';
const BUCKET_NAME = 'image-processing-dynamo-results';
await sync(`s3://${BUCKET_NAME}`, './s3');
console.log('S3 bucket synced');

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

  const selectedPropsMapper = (x: any) => ({
    timestamp: x.timestamp,
    '!isoDate': x['!isoDate'],
    dayOfWeek: new Date(x.timestamp).getDay(),
    provider: x.provider,
    outputFormat: x.outputFormat,
    outputWidth: x.outputWidth,
    providerMemoryAssociated: x.providerMemoryAssociated,
  })

  // const allDatapointsWithSelectedProps = datapoints.map(selectedPropsMapper);
  console.log(datapoints.length, 'datapoints loaded from', gzFilePath);
  allDatapoints = allDatapoints.concat(datapoints);
});

console.log(allDatapoints.length, 'datapoints loaded in total');
const allDatapointsWithSelectedProps = allDatapoints;
// const selectedPropsMapper = ({ timestamp, num }) => ({ timestamp })
// const allDatapointsWithSelectedProps = allDatapoints.map(selectedPropsMapper);
const datapointsSorted = allDatapointsWithSelectedProps.sort((a, b) => a.timestamp - b.timestamp);

// Export to CSV
const csv = stringify(datapointsSorted, { header: true });
fs.writeFileSync(`stats-latest.csv`, csv);
console.log('CSV exported once');
fs.writeFileSync(`stats-${new Date(lastDynamoDbExportTimestamp).toISOString()}.csv`, csv);
console.log('CSV exported twice');
