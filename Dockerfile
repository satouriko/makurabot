FROM node:14.15.1-alpine
COPY package.json /telegram-twitter-bot/package.json
RUN cd /telegram-twitter-bot && npm install
COPY . /telegram-twitter-bot
WORKDIR /telegram-twitter-bot/src
CMD node index.js
VOLUME ["/data"]
ARG COMMIT_SHA=""
ENV COMMIT_SHA=$COMMIT_SHA
