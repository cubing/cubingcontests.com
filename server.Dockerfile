FROM node:18-alpine

RUN apk update && apk upgrade

COPY server /home/app/server
COPY client/shared_helpers /home/app/client/shared_helpers

WORKDIR /home/app/server

RUN npm install
RUN npm run build

# Same as the port above
EXPOSE 5000

CMD [ "npm", "start" ]
