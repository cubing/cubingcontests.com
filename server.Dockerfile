FROM node:22-alpine

RUN apk update && apk upgrade

EXPOSE $BACKEND_PORT

COPY server /home/app/server

WORKDIR /home/app/server

RUN npm install
RUN npm run build

CMD [ "npm", "run", "start:prod" ]
