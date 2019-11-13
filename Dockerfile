FROM node:10.16-alpine
COPY package.json /telegram-twitter-bot/package.json
RUN cd /telegram-twitter-bot && npm install
COPY . /telegram-twitter-bot
WORKDIR /telegram-twitter-bot
CMD node index.js
VOLUME ["/data"]
