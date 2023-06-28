FROM node:18-alpine

RUN apk update && apk upgrade

COPY client /home/app/client
COPY shared_helpers /home/app/shared_helpers

WORKDIR /home/app/client

ENV API_BASE_URL='https://cubingcontests.denimintsaev.com/api'

RUN npm install
RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
