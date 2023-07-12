# Cubing Contests

This is a place for posting results from unofficial Rubik's cube competitions or speedcuber meetups. All official WCA events are supported, and additional unofficial events can be added. It's currently a work-in-progress, but eventually this will (hopefully) be an open platform for posting results that anyone will be able to spin up on their own server and use for their own local community. Of course, there is also going to be the [**main instance**](https://cubingcontests.denimintsaev.com/) that will be available to everyone.

## Screenshots

<img src="https://denimintsaev.com/api/cubing_contests_1.jpg" width="300"/>

<img src="https://denimintsaev.com/api/cubing_contests_2.jpg" width="300"/>

## Admin features (WIP section)

In order to enable records tracking, the admin has to go to the `Configure record types` page, which can be found on the admin dashboard, and set the wanted records as active. They can also be given custom custom labels in order to differentiate them from official WCA records. **ATTENTION:** for now only WRs are supported.

## Deployment

If you would like to deploy your own Cubing Contests instance, follow these instructions. To-do: add instructions...

## Development

This project uses Next JS for the front-end and Nest JS (confusing, I know) with Mongo DB for the back-end. To set up the development environment, install Node and NPM, clone this repository and then run the init script that sets up the git hooks:

```
.githooks/init
```

The pre-commit hook runs all tests and ESLint. If there are tests that don't pass or linting errors, the commit will **not** be successful.

There is an important `shared_helpers` directory in the `client` directory that is used in both `client` and `server`. They both have a `@sh` path alias to it in their respective `tsconfig.json` files. The reason it's in the `client` directory is that Next JS does not support importing files from outside of its root directory. You can also find other path aliases in `client/tsconfig.json` and `server/tsconfig.json`.

### Server set-up

The simplest way to run the back-end is to use the `test-backend.sh` script. The server listens on port 4000.

### Client set-up

```bash
cd client
npm install # install the dependencies
npm run dev # run the server in development mode
```

### Data structure

The structure of the different kinds of data (e.g. competitions, rounds, events, etc.) that is stored in the database is determined by the following:

- **Interface** - describes the structure of the data in the DB. Example: `ICompetition`.
- **Schema class** - implements the interface and is used to store the data in the DB. Also has a document type in the same file that is used as the return type for documents of that model.
- **Create DTO class** - implements the interface and is used for validating POST requests that create new documents in the DB. May be missing some fields from the interface, if they are not needed on creation. Those fields can be marked as optional in the interface, or, alternatively, the class can simply not implement any interface. In the latter case you have to remember to update the DTO when updating the interface. Example: `CreateCompetitionDto`.
- **Update DTO class** - extends the create DTO class and is used for validating PATCH requests. If needed, some fields can be added here to make them editable after the creation of the document. Example: `UpdateCompetitionDto`.
