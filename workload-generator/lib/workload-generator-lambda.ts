import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const URL = 'https://jsonplaceholder.typicode.com/posts/1';

export const handler = async () => {
  const timestamp = Date.now();

  try {
    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    const result = await response.json();
    const params = { TableName: process.env.TABLE_NAME, Item: { timestamp, result } };
    const command = new PutCommand(params);
    await docClient.send(command);
    console.log("Success - item added", timestamp);
    return 200;

  } catch (err) {
    console.error("Error during fetch or DynamoDB put:", err);
    return 500;
  }
}
