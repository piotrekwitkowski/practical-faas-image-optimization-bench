
import { App, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ResultsTable, SchedulerFunction } from './constructs';

export class WorkloadGeneratorStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // Shared role for all Lambda functions
    const lambdaExecutionRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
    });

    // DynamoDB table to store responses
    const benchmarkResults = new ResultsTable(this, 'BenchmarkResults', {
      tableName: 'results-gcp',
      writerRole: lambdaExecutionRole
    });

    // Sets of parameters to generate functions
    const clouds = ['gcp'] as const;
    const imageNames = ['landscape', 'portrait'];
    const memorySizes = [885, 1769, 3538]; // 0.5vCPU, 1vCPU, 2vCPU 
    const outputFormats = ['avif', 'jpeg', 'webp'];
    const outputWidths = [640, 1080, 1920];

    // Lambda functions for image processing
    clouds.forEach(cloud => {
      imageNames.forEach(imageName => {
        memorySizes.forEach(memorySize => {
          outputFormats.forEach(outputFormat => {
            outputWidths.forEach(outputWidth => {
              const id = `${imageName}-${memorySize}-${outputFormat}-${outputWidth}`;
              const lambda = new SchedulerFunction(this, id, {
                cloud,
                resultsTableName: benchmarkResults.tableName,
                role: lambdaExecutionRole
              });

              // EventBridge rule to trigger Lambda periodically
              new Rule(this, `Rule-${id}`, {
                ruleName: `rule-${id}`,
                schedule: Schedule.rate(Duration.minutes(5)), // replace with desired interval as needed
                targets: [new LambdaFunction(lambda)]
              });
            });
          });
        });
      });
    });
  }
}
