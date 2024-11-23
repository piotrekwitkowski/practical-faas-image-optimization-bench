import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async () => {
  const start = new Date();
  const timeInfo = {
    timestamp: start.getTime(),
    '!isoDate': start.toISOString(),
  }

  try {
    const response = await fetch(process.env.URL!);
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
