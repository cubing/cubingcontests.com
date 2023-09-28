FROM node:18-alpine

RUN apk update && apk upgrade

COPY client /home/app/client

WORKDIR /home/app/client

# Use --build-arg API_BASE_URL='...' to set this
ENV API_BASE_URL=$API_BASE_URL

RUN npm install
RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
