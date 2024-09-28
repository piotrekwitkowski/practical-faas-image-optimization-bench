import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Architecture, Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class ImageProcessingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // API Gateway to expose Lambda functions
    const api = new HttpApi(this, 'ImageProcessingApi');

    // Shared role for all Lambda functions
    const lambdaBasicExecutionRole = new Role(this, 'LambdaBasicExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
    });

    // Lambda layers for dependencies like images and native libraries
    const layer = (id: string, path: string) => new LayerVersion(this, id, {
      code: Code.fromAsset(path),
      compatibleArchitectures: [Architecture.X86_64],
    });
    const sharpNativeLayer = layer('SharpNativeLayer', 'lib/layers/sharp');

    const createImageProcessing = (
      imageLayer: LayerVersion,
      imageName: string,
      memorySize: number,
      outputFormat: string,
      outputWidth: number
    ) => {
      const id = `${imageName}-${memorySize}-${outputFormat}-${outputWidth}`;
      const lambda = new NodejsFunction(this, `ImageProcessing-${id}`, {
        bundling: {
          banner: '/* global crypto */',
          externalModules: ['@aws-sdk/*', 'sharp'],
          format: OutputFormat.ESM,
        },
        entry: 'lib/image-processing-lambda.ts',
        environment: {
          IMAGE_NAME: imageName,
          MEMORY_SIZE: '' + memorySize,
          OUTPUT_FORMAT: outputFormat,
          OUTPUT_WIDTH: '' + outputWidth,
        },
        functionName: `ImageProcessing-${id}`,
        memorySize,
        layers: [sharpNativeLayer, imageLayer],
        role: lambdaBasicExecutionRole,
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.seconds(600),
      });
      api.addRoutes({ integration: new HttpLambdaIntegration(id, lambda), methods: [HttpMethod.GET], path: `/${id}`});
    };

    // Sets of parameters to generate functions
    const imageNames = ['landscape', 'portrait'];
    const memorySizes = [885, 1769, 3538]; // 0.5vCPU, 1vCPU, 2vCPU 
    const outputFormats = ['avif', 'jpeg', 'webp'];
    const outputWidths = [640, 1080, 1920];

    // Lambda functions for image processing
    imageNames.forEach(imageName => {
      const imageLayer = layer(`ImageLayer-${imageName}`, `lib/layers/${imageName}`);
      memorySizes.forEach(memorySize => {
        outputFormats.forEach(outputFormat => {
          outputWidths.forEach(outputWidth => {
            createImageProcessing(imageLayer, imageName, memorySize, outputFormat, outputWidth);
          });
        });
      });
    });

    // Publish API URL as CfnOutput
    new CfnOutput(this, 'ExampleApiUrl', { value: api.url!, description: 'Append processing IDs to execute specific functions' });
  }
}
