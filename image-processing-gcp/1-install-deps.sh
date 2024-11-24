#!/bin/bash

for image_name in landscape portrait; do
  echo "Building $image_name"
  npm install --prefix=$image_name
  npm install sharp --prefix=$image_name --os=linux --cpu=x64 --libc=glibc --no-save
done