#!/bin/bash

./build.sh
docker stop makurabot
docker rm makurabot
./start.sh
