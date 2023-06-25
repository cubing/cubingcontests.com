FROM node:18-alpine

RUN apk update && apk upgrade

COPY server /home/app/server
COPY shared_helpers /home/app/shared_helpers

WORKDIR /home/app/server

ENV PORT=4000

RUN npm install && npm run build

# Same as the port above
EXPOSE 4000

CMD [ "npm", "start" ]
