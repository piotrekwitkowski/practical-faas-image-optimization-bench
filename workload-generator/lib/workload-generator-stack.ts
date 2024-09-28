
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

    // DynamoDB table to store responses
    const benchmarkResults = new Table(this, 'BenchmarkResults', {
      tableName: 'results-20240928', // change table name to drop all previous results
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'timestamp', type: AttributeType.NUMBER },
    });

    // Shared role for all Lambda functions
    const lambdaExecutionRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    // Lambda function to invoke HTTP endpoints
    const workloadGenerator = (id: number) => new NodejsFunction(this, `WorkloadGenerator${id}`, {
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
      memorySize: 1769, // https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html
      role: lambdaExecutionRole,
      runtime: Runtime.NODEJS_20_X,
      timeout: MAX_LAMBDA_DURATION
    });

    // Workload generator functions
    const fn1 = workloadGenerator(1);
    const fn2 = workloadGenerator(2);

    benchmarkResults.grantWriteData(lambdaExecutionRole);

    // EventBridge rule to trigger Lambda periodically
    new Rule(this, 'WorkloadGeneratorRule', {
      ruleName: 'WorkloadGeneratorRule',
      schedule: Schedule.rate(WORKLOAD_GENERATOR_RATE_MINUTES), // replace with desired interval as needed
      targets: [
        new LambdaFunction(fn1),
        new LambdaFunction(fn2),
      ]
    });
  }
}
