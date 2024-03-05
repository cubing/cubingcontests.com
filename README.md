# Cubing Contests

This is a place for hosting unofficial Rubik's cube competitions, unofficial events held at WCA competitions, speedcuber meetups, and other unofficial events.

## Screenshots

<img src="https://cubingcontests.com/api/cubing_contests_1.jpg" width="500"/>

<img src="https://cubingcontests.com/api/cubing_contests_2.jpg" width="500"/>

<img src="https://cubingcontests.com/api/cubing_contests_3.jpg" width="500"/>

<img src="https://cubingcontests.com/api/cubing_contests_4.jpg" width="500"/>

<img src="https://cubingcontests.com/api/cubing_contests_5.jpg" width="500"/>

<img src="https://cubingcontests.com/api/cubing_contests_6.jpg" width="500"/>

<div style="display: flex; flex-wrap: wrap; gap: 2rem;">
  <img src="https://cubingcontests.com/api/cubing_contests_7.jpg" width="300"/>
  <img src="https://cubingcontests.com/api/cubing_contests_8.jpg" width="300"/>
</div>

## Deployment

Please do **NOT** try to deploy your own instance until this project is ready for that (you will find instructions in this section).

## Development

This project uses Next JS for the frontend and Nest JS (confusing, I know) with Mongo DB for the backend. To set up the development environment, install Node, NPM, the Nest JS CLI, and Docker, clone this repository, and then run the following commands:

```sh
./scripts/init.sh # set up Git hooks and copy .env.example to .env

cd client
npm install # install frontend packages

cd ../server
npm install # install backend packages
```

The pre-commit hook runs all tests, ESLint, and a test build of the frontend. If there are tests that don't pass, any linting errors, or an error during the build of the frontend, the commit will **not** be successful. You can avoid this behavior by adding the -n flag when committing.

To start just the backend and the DB in development, run this command in the `server` directory:

```sh
npm run fulldev
```

To start **both** the frontend and the backend, run **the same command** in the `client` directory. That version of the command starts the frontend, the backend, and the DB.

Go to `localhost:3000` to see the website. Go to `localhost:8080` to see Mongo Express (makes it much easier to work with the database). `localhost:5000` is used by the backend.

There is an important `shared_helpers` directory in the `client` directory that is used in both `client` and `server`. They both have a `@sh` path alias to it in their respective `tsconfig.json` files. The reason it's in the `client` directory is that Next JS does not support importing files from outside of its root directory. You can also find other path aliases in `client/tsconfig.json` and `server/tsconfig.json`.

### Environment

Environment variables are specified in `.env` in the root directory and are automatically sourced by Docker. Simply copy the `.env.example` file, rename it to `.env` (which is not tracked by git in this repo), and change the values of the variables. This works the same way in production and in development.

Some backend environment variables are specified in the `server/.env.dev` file. This file is automatically read by Nest JS in development. In production this file is ignored, and the container's environment variables (coming from the `.env` file) are used instead.

Frontend environment variables are specified in the `client/.env.local` file. This file is automatically read by Next JS. See that file for more details. The values are taken from the frontend container's environment variables. These must be set during the container's build process when deploying, because that is when Next JS sets the variables in `.env.local`.

### Data structure

The structure of the different kinds of data (e.g. competitions, rounds, events, etc.) that is stored in the database is determined by the following:

- **Interface** - describes the structure of the data in the DB. Example: `IContest`, found in `shared_helpers`.
- **Schema class** - implements the interface and is used to store the data in the DB. Also has a document type in the same file that is used as the return type for documents of that model. These are all found in the `server/src/models` directory. **IMPORTANT**: if you use VS Code, use the `monmod` snippet to create a new schema and the related classes. Use this in your new `.model.ts` files inside of `server/src/models`.
- **Create DTO class** - optionally implements the same interface and is used for validating POST requests that create new documents in the DB. May be missing some fields from the interface, if they are not needed on creation. If the class doesn't implement the interface, you have to remember to update the DTO accordingly when updating the interface. Example: `CreateContestDto`.
- **Update DTO class** - extends the create DTO class with a partial extend, and is used for validating PATCH requests. If needed, some fields can be added here to make them editable after the creation of the document. Example: `UpdateContestDto`.

Also keep in mind that the structure of many objects like competitions and rounds is mostly similar to the [WCIF specification](https://github.com/thewca/wcif/blob/master/specification.md).