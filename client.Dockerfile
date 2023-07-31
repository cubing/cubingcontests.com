FROM node:18-alpine

RUN apk update && apk upgrade

COPY client /home/app/client

WORKDIR /home/app/client

ENV API_BASE_URL='https://cubingcontests.com/api'

RUN npm install
RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
