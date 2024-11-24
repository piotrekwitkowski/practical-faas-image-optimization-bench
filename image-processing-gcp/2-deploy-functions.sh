for image_name in landscape portrait; do
  for memory_size in 885 1769 3538; do
    for output_format in avif jpeg webp; do
      for output_width in 640 1080 1920; do
        # date +"%Y-%m-%d %H:%M:%S"
        echo "Deploying $image_name-$memory_size-$output_format-$output_width..."
  
        # Conditional CPU allocation
        if [[ $memory_size -eq 885 ]]; then
          cpu_value="0.5"
        elif [[ $memory_size -eq 1769 ]]; then
          cpu_value="1"
        elif [[ $memory_size -eq 3538 ]]; then
          cpu_value="2"
        fi

        gcloud functions deploy $image_name-$memory_size-$output_format-$output_width \
          --allow-unauthenticated \
          --cpu=$cpu_value \
          --entry-point=main \
          --format=none \
          --gen2 \
          --memory=$memory_size \
          --region=us-east1 \
          --runtime=nodejs20 \
          --set-build-env-vars=GOOGLE_VENDOR_NPM_DEPENDENCIES=true \
          --set-env-vars=IMAGE_NAME=$image_name,MEMORY_SIZE=$memory_size,OUTPUT_FORMAT=$output_format,OUTPUT_WIDTH=$output_width \
          --source=$image_name \
          --trigger-http
      done
    done
  done
done