FROM node:22-alpine

RUN apk update && apk upgrade

COPY server /home/app/server

WORKDIR /home/app/server

RUN npm install
RUN npm run build

EXPOSE $BACKEND_PORT

CMD [ "npm", "start" ]
