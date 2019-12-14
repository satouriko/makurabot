#!/bin/bash

source .env

docker run -d --restart=always \
  --name makurabot \
  --mount type=volume,src=makurabot-data,dst=/data \
  -e GM0="$GM0" -e GM1="$GM1" -e GM2="$GM2" -e TOKEN="$TOKEN" \
  -e TWITTER_CONSUMER_KEY="$TWITTER_CONSUMER_KEY" \
  -e TWITTER_CONSUMER_SECRET="$TWITTER_CONSUMER_SECRET" \
  -e TWITTER_ACCESS_TOKEN_KEY="$TWITTER_ACCESS_TOKEN_KEY" \
  -e TWITTER_ACCESS_TOKEN_SECRET="$TWITTER_ACCESS_TOKEN_SECRET" \
  -e NETLIFY_WEBHOOK_2645LAB="$NETLIFY_WEBHOOK_2645LAB" \
  -e HEWEATHER_KEY="$HEWEATHER_KEY" \
  -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
  makurabot
