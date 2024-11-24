# image-processing-gcp

Contents of `landscape` and `portrait` directories are the same with an exception of the included photo `image.jpg`.

## Installing dependencies
GCP functions' environment may differ from your local one. It is important to optimise node_modules deployment size, by installing only (native) dependencies for the correct target platform. Because `package.json` do not support the same flags that are supported by `npm install`, we do not save sharp in package.json. Run these commands to install deps before deployment:
```
bash ./1-install-deps.sh
```

## Deployment
We recommend deployment using [gcloud CLI](https://cloud.google.com/functions/docs/create-deploy-gcloud). More docs on using deploy can be found in the [gcloud SDK reference](https://cloud.google.com/sdk/gcloud/reference/functions/deploy).

```
bash ./2-deploy-functions.sh
```

If deploying manually, remember to set the following env variables:
- `IMAGE_NAME` landscape / portrait
- `MEMORY_SIZE` 885 / 1769 / 3538
- `OUTPUT_FORMAT` avif / jpeg / webp
- `OUTPUT_WIDTH` 640 / 1080 / 1920

Set memory and corresponding vCPU as deployment props to match AWS settings:
- 885MB -> 0.5 vCPU
- 1769MB -> 1vCPU
- 3538MB -> 2vCPUs

Use [vendored dependencies](https://cloud.google.com/functions/docs/writing/specifying-dependencies-nodejs#build_your_function_with_vendored_dependencies). You create vendored Node.js dependencies and skip installing them during deployment by using `GOOGLE_VENDOR_NPM_DEPENDENCIES` build environment variable, see below.

```
gcloud functions deploy esm-landscape \
  --allow-unauthenticated \
  --cpu=0.5 \
  --entry-point=main \
  --gen2 \
  --memory=885 \
  --region=us-east1 \
  --runtime=nodejs20 \
  --set-build-env-vars=GOOGLE_VENDOR_NPM_DEPENDENCIES=true \
  --set-env-vars=IMAGE_NAME=landscape,MEMORY_SIZE=885,OUTPUT_FORMAT=avif,OUTPUT_WIDTH=640 \
  --source=landscape \
  --trigger-http
```

## Learn more
This simple tutorial demonstrates writing, deploying, and triggering an HTTP Cloud Run functions: https://cloud.google.com/functions/docs/tutorials/http
