
import { App, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';

const WORKLOAD_GENERATOR_RATE_MINUTES = Duration.minutes(5);
const MAX_LAMBDA_DURATION = Duration.minutes(15);

export class WorkloadGeneratorStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // Shared role for all Lambda functions
    const lambdaExecutionRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    // DynamoDB table to store responses
    const benchmarkResults = new Table(this, 'BenchmarkResults', {
      tableName: 'results-20240929', // change table name to drop all previous results
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'timestamp', type: AttributeType.NUMBER },
    });
    benchmarkResults.grantWriteData(lambdaExecutionRole);

    // Lambda function to invoke HTTP endpoints
    const generateWorkload = (id: string) => {
      const lambda = new NodejsFunction(this, `WorkloadGenerator-${id}`, {
        bundling: {
          banner: '/* global fetch */', // to avoid AWS Lambda console warning
          externalModules: ['@aws-sdk/*'], // otherwise these modules are bundled, which is not required on Lambda
          format: OutputFormat.ESM, // CJS is the unwanted default
        },
        entry: './lib/workload-generator-lambda.ts',
        environment: {
          TABLE_NAME: benchmarkResults.tableName,
          URL: `https://30a0oxyee9.execute-api.us-east-1.amazonaws.com/${id}`,
        },
        functionName: `WorkloadGeneratorFunction${id}`,
        memorySize: 256,
        role: lambdaExecutionRole,
        runtime: Runtime.NODEJS_20_X,
        timeout: MAX_LAMBDA_DURATION
      });

      // EventBridge rule to trigger Lambda periodically
      new Rule(this, `WorkloadGeneratorRule-${id}`, {
        ruleName: `WorkloadGeneratorRule-${id}`,
        schedule: Schedule.rate(WORKLOAD_GENERATOR_RATE_MINUTES), // replace with desired interval as needed
        targets: [new LambdaFunction(lambda)]
      });
    };

    // Sets of parameters to generate functions
    const imageNames = ['landscape', 'portrait'];
    const memorySizes = [885, 1769, 3538]; // 0.5vCPU, 1vCPU, 2vCPU 
    const outputFormats = ['avif', 'jpeg', 'webp'];
    const outputWidths = [640, 1080, 1920];

    // Lambda functions for image processing
    imageNames.forEach(imageName => {
      memorySizes.forEach(memorySize => {
        outputFormats.forEach(outputFormat => {
          outputWidths.forEach(outputWidth => {
            const id = `${imageName}-${memorySize}-${outputFormat}-${outputWidth}`;
            generateWorkload(id);
          });
        });
      });
    });
  }
}
