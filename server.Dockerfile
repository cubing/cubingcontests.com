FROM node:22-alpine

RUN apk update && apk upgrade

EXPOSE $BACKEND_PORT

COPY server /home/app/server
RUN rm /home/app/server/.env.dev

WORKDIR /home/app/server

RUN npm install
RUN npm run build

CMD [ "npm", "run", "start:prod" ]
