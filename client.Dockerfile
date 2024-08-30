FROM node:20-alpine

RUN apk update && apk upgrade

COPY client /home/app/client

WORKDIR /home/app/client

ARG API_BASE_URL

ENV ENVIRONMENT=production

RUN npm install
RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
