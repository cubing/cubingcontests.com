FROM node:18-alpine

RUN apk update && apk upgrade

COPY server /home/app/server
COPY client/shared_helpers /home/app/client/shared_helpers

WORKDIR /home/app/server

ENV PORT=5000

RUN npm install
RUN npm run build
RUN cp -r /home/app/server/public /home/app/server/dist/server/public

# Same as the port above
EXPOSE 5000

CMD [ "npm", "start" ]
