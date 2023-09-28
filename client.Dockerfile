FROM node:18-alpine

RUN apk update && apk upgrade

COPY client /home/app/client

WORKDIR /home/app/client

RUN npm install
RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
