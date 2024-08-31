#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ImageProcessingStack } from '../lib/image-processing-stack';

const app = new cdk.App();
new ImageProcessingStack(app, 'ImageProcessingStack');
