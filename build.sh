#!/bin/bash

docker build \
  --build-arg COMMIT_SHA="$(git rev-parse HEAD)" \
  --tag="makurabot" \
  .
