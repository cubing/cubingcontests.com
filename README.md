# Cubing Contest Results

This is a place for posting results from Rubik's cube meetups. It's currently a work-in-progress, but eventually this will (hopefully) be a platform for posting contest results that anyone will be able to spin up on their own server and use for their own local community.

## Development

THIS IS A WORK-IN PROGRESS! THESE INSTRUCTIONS DO NOT WORK YET!

This project uses Next JS for the front-end and Nest JS (confusing, I know) with Mongo DB for the back-end. To set up the development environment, install Node and NPM, clone this repository and then follow the following steps:

### Client set-up

```bash
.githooks/init
cd client
npm install
npm run dev
```

### Server set-up

```bash
.githooks/init # if not already done for the client set-up
npm install --global @nestjs/cli@latest
cd server
npm install
npm run dev
```

### Data structure

The structure of the different kinds of data (e.g: competitions, rounds, events, etc.) that are stored in the database is determined by multiple files. There are always three parts to it: an interface that determines the structure of the data, a schema that determines how the data is stored in the database (this **MUST** match the structure of the interface), and a create DTO class. The latter is used to validate incoming requests from the front-end and can either implement the interface or have a different structure if needed.
