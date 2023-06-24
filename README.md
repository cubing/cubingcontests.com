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

The simplest way to run the back-end if you only want to do work on the front-end is to use the `test-backend.sh` script. The server listens on port 6000. If you need to work on the back-end, ????? (WIP)

```bash
.githooks/init # if not already done for the client set-up
npm install --global @nestjs/cli@latest
cd server
npm install
npm run dev
```

### Data structure

The structure of the different kinds of data (e.g. competitions, rounds, events, etc.) that is stored in the database is determined by the following objects:

- Base interface - used as the interface for the create DTO, or can be used by other classes or interfaces. Example: `ICompetitionBase`.
- Model interface - extends the base interface, if it exists, and is used to describe the structure of the data in the DB. Example: `ICompetition`.
- Schema - used to store the data in the DB. The schema **MUST** mirror the structure of the model interface. Also has a document interface in the same file that simply extends the `Document` class and the model interface, and is used as the return type for documents of that model.
- Create DTO class - implements the base interface or the regular model interface, if there is no base one. Used for validating POST requests that create new documents in the DB. Example: `CreateCompetitionDto`.
- Update DTO class - extends the create DTO class and is used for validating PATCH requests. If the data is stored in the DB with a different structure from how it is passed in PATCH requests, adds additional fields. Example: `UpdateCompetitionDto`.
