import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const URL = 'https://30a0oxyee9.execute-api.us-east-1.amazonaws.com/1';

export const handler = async () => {
  const start = new Date();
  const timeInfo = {
    timestamp: start.getTime(),
    '!isoDate': start.toISOString(),
  }

  try {
    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    const result = await response.json();
    const params = { TableName: process.env.TABLE_NAME, Item: { ...timeInfo, ...result } };
    const command = new PutCommand(params);
    await docClient.send(command);
    return 200;

  } catch (err) {
    console.error("Error during fetch or DynamoDB put:", err);
    return 500;
  }
}
