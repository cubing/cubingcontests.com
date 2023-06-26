# Cubing Contests

This is a place for posting results from unofficial Rubik's cube competitions or cuber meetups. It's currently a work-in-progress, but eventually this will (hopefully) be an open platform for posting results that anyone will be able to spin up on their own server and use for their own local community. Of course, there is also going to be the main instance that will be available to everyone.

## Development

This project uses Next JS for the front-end and Nest JS (confusing, I know) with Mongo DB for the back-end. To set up the development environment, install Node and NPM, clone this repository and then run the init script that sets up the git hooks:

```
.githooks/init
```

### Server set-up

The simplest way to run the back-end is to use the `test-backend.sh` script. The server listens on port 4000.

### Client set-up

```bash
cd client
npm install
npm run dev
```

### Data structure

The structure of the different kinds of data (e.g. competitions, rounds, events, etc.) that is stored in the database is determined by the following:

- Interface - describes the structure of the data in the DB. Example: `ICompetition`.
- Schema class - implements the interface and is used to store the data in the DB. Also has a document type in the same file that is used as the return type for documents of that model.
- Create DTO class - implements the interface and is used for validating POST requests that create new documents in the DB. May be missing some fields from the interface, if they are not needed on creation. Those fields are marked as optional in the interface. Example: `CreateCompetitionDto`.
- Update DTO class - extends the create DTO class and is used for validating PATCH requests. If needed, some fields can be added here to make them editable after the creation of the document.. Example: `UpdateCompetitionDto`.
