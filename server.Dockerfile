FROM node:22-alpine

RUN apk update && apk upgrade

COPY server /home/app/server
COPY client/shared_helpers /home/app/client/shared_helpers
# This is needed, because some shared_helpers files import NPM modules
COPY client/node_modules /home/app/client/node_modules

WORKDIR /home/app/server

RUN npm install
RUN npm run build

# Same as the port above
EXPOSE 5000

CMD [ "npm", "start" ]
