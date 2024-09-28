import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Architecture, Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class ImageProcessingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // API Gateway to expose Lambda functions
    const api = new HttpApi(this, 'ImageProcessingApi');

    // Memory size associated with the function
    // https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html
    const lambdaMemorySize = 1769; // MBs

    // Shared role for all Lambda functions
    const lambdaBasicExecutionRole = new Role(this, 'LambdaBasicExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
    })

    // Lambda layers for dependencies like images and native libraries
    const layer = (id: string, path: string) => new LayerVersion(this, id, {
      code: Code.fromAsset(path),
      compatibleArchitectures: [Architecture.X86_64],
    });
    const sharpNativeLayer = layer('SharpNativeLayer', 'lib/layers/sharp');

    // Lambda function for image processing
    const imageProcessingForId = (id: string) => {
      const imageLayer = layer(`ImageLayer${id}`, `lib/layers/image${id}`);
      return new NodejsFunction(this, `ImageProcessing${id}`, {
        bundling: {
          banner: '/* global crypto */', // to avoid AWS Lambda console warning
          externalModules: ['@aws-sdk/*', 'sharp'], // available in runtime
          format: OutputFormat.ESM, // CJS is the unwanted default
        },
        entry: 'lib/image-processing-lambda.ts',
        environment: {
          ASSOCIATED_MEMORY_MB: '' + lambdaMemorySize,
          IMAGE_ID: id
        },
        memorySize: lambdaMemorySize,
        layers: [sharpNativeLayer, imageLayer],
        role: lambdaBasicExecutionRole,
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.seconds(600),
      });
    }

    // IDs of individual images / lambda functions, 1-based
    const ids = new Array(2).fill(0).map((_, i) => i + 1);

    // Lambda functions with different images
    const lambdas = ids.map(id => imageProcessingForId(id.toString()));

    // Define paths for each image processing Lambda
    lambdas.forEach((lambda, index) => api.addRoutes({ path: `/${index + 1}`, integration: new HttpLambdaIntegration(`/${index + 1}`, lambda) }));

    // Publish API URL as CfnOutput
    new CfnOutput(this, 'ExampleApiUrl', { value: api.url + '1', description: 'Replace /1 with other image IDs' });
  }
}
