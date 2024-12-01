import { Duration } from "aws-cdk-lib";
import { Role } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

const BASE_URLS = {
  aws: 'https://zhak5f4skf.execute-api.us-east-1.amazonaws.com/',
  gcp: 'https://us-east1-piotrekwitkowski1.cloudfunctions.net/'
}

interface SchedulerFunctionProps {
  cloud: 'aws' | 'gcp';
  role: Role;
  resultsTableName: string;
}

// Lambda function to invoke HTTP endpoints
export class SchedulerFunction extends NodejsFunction {
  constructor(scope: Construct, id: string, props: SchedulerFunctionProps) {
    const imageProcessingUrl = BASE_URLS[props.cloud] + id;
    super(scope, `WorkloadGenerator-${props.cloud}-${id}`, {
      bundling: {
        banner: '/* global fetch */', // to avoid AWS Lambda console warning
        externalModules: ['@aws-sdk/*'], // otherwise these modules are bundled, which is not required on Lambda
        format: OutputFormat.ESM, // CJS is the unwanted default
      },
      entry: __dirname + '/scheduler-lambda-entry.ts',
      environment: {
        TABLE_NAME: props.resultsTableName,
        URL: imageProcessingUrl,
      },
      functionName: `WorkloadGenerator-${props.cloud}-${id}`,
      memorySize: 256,
      role: props.role,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.minutes(15)
    });
  }
};
