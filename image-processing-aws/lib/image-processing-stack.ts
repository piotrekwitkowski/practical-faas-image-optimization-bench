import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Architecture, Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class ImageProcessingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaBasicExecutionRole = new Role(this, 'LambdaBasicExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")]
    })

    // Lambda layer dependencies
    const sharpNativeLayer = new LayerVersion(this, 'SharpNativeLayer', {
      code: Code.fromAsset('lib/dependencies'),
      compatibleArchitectures: [Architecture.X86_64],
    });

    // Lambda for image processing
    const imageProcessingForId = (id: string) => new NodejsFunction(this, `ImageProcessing${id}`, {
      bundling: { externalModules: ['@aws-sdk/*', 'sharp'], format: OutputFormat.ESM },
      entry: 'lib/image-processing-lambda.ts',
      environment: { IMAGE_ID: id },
      layers: [sharpNativeLayer],
      role: lambdaBasicExecutionRole,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(600),
    });

    // IDs of individual images / lambda functions
    const ids = new Array(1).fill(0).map((_, i) => i + 1);

    // Lambda functions with different images
    const lambdas = ids.map(id => imageProcessingForId(id.toString()));
  }
}
