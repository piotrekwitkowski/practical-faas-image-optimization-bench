
import { App, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';

const WORKLOAD_GENERATOR_RATE_MINUTES = Duration.minutes(5);
const MAX_LAMBDA_DURATION = Duration.minutes(15);

export class WorkloadGeneratorStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB table to store responses
    const benchmarkResults = new Table(this, 'BenchmarkResults', {
      tableName: 'results-20240913', // change table name to drop all previous results
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'timestamp', type: AttributeType.NUMBER },
    });

    // Lambda function to invoke HTTP endpoints
    const workloadGenerator = new NodejsFunction(this, 'WorkloadGenerator', {
      bundling: {
        banner: '/* global fetch */', // to avoid AWS Lambda console warning
        externalModules: ['@aws-sdk/*'], // otherwise these modules are bundled, which is not required on Lambda
        format: OutputFormat.ESM, // CJS is the unwanted default
      },
      entry: './lib/workload-generator-lambda.ts',
      environment: { TABLE_NAME: benchmarkResults.tableName },
      functionName: 'WorkloadGeneratorFunction',
      memorySize: 512,
      runtime: Runtime.NODEJS_20_X,
      timeout: MAX_LAMBDA_DURATION
    });

    benchmarkResults.grantWriteData(workloadGenerator);

    // EventBridge rule to trigger Lambda periodically
    new Rule(this, 'WorkloadGeneratorRule', {
      ruleName: 'WorkloadGeneratorRule',
      schedule: Schedule.rate(WORKLOAD_GENERATOR_RATE_MINUTES), // replace with desired interval as needed
      targets: [new LambdaFunction(workloadGenerator)]
    });
  }
}
