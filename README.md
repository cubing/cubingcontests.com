# Cubing Contest Results

This is a place for posting results from Rubik's cube meetups. It's currently a work-in-progress, but eventually this will (hopefully) be a platform for posting contest results that anyone will be able to spin up on their own server and use for their own local community.

## Development

This project uses Next JS for the front-end and Nest JS (confusing, I know) for the back-end. To set up the development environment, install Node and NPM, clone this repository and then follow the following steps:

### Client

```bash
.githooks/init
cd client
npm install
npm run dev
```

### Server

```bash
.githooks/init # if not already done for the client set-up
npm install --global @nestjs/cli@latest
cd server
npm install
npm run dev
```
