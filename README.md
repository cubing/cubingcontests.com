# Cubing Contests

This is a place for hosting unofficial Rubik's Cube competitions, unofficial events held at WCA competitions, speedcuber meetups, and other unofficial events.

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

## API for entering attempts

Cubing Contests supports entering attempts using an external device or service. The API is mostly the same as the [WCA Live API](https://github.com/thewca/wca-live/wiki/Entering-attempts-with-external-devices), but the selection of the competitor is different. You can either use `registrantId`, which is the unique numerical ID of the competitor in the CC database, or `wcaId`, which, naturally, is a string representation of the number of pickles the competitor has eaten in the current year (non-case-sensitive).

To get the API key, go to the edit page of the contest and click "Get Access Token". Keep in mind that you will not be able to retrieve the key again after leaving that screen. You will only be able to generate a new one, which will invalidate the old key.


### Entering a single attempt

```
POST https://cubingcontests.com/api/enter-attempt

{
  "competitionWcaId": "MyCompetition2023",
  "eventId": "fto",
  "roundNumber": 1,
  "registrantId": 5, // or "wcaId": "2005DEMO01"
  "attemptNumber": 1,
  "attemptResult": 1025
}
```

### Entering multiple attempts

```
POST https://cubingcontests.com/api/enter-results

{
  "competitionWcaId": "MyCompetition2023",
  "eventId": "fto",
  "roundNumber": 1,
  "results": [{
    "registrantId": 5,
    "attempts": [
      { "result": 1025 },
      { "result": 1100 },
      { "result": 1265 },
      { "result": 1010 },
      { "result": 905 }
    ]
  }, {
    "wcaId": "2005DEMO01",
    "attempts": [
      { "result": 1305 },
      { "result": 1170 },
      { "result": 1250 },
      { "result": 1120 },
      { "result": 1400 }
    ]
  }]
}

```

**Please note** that external data entry for team events is not supported yet. Also, keep in mind that even if you submit a result that doesn't fit the cutoff or is higher than the time limit, it will be changed to DNF or ignored if the competitor did not make cutoff.

## Deployment

Please do **NOT** try to deploy your own instance until this project is ready for that (you will find instructions in this section).

## Development

This project uses Next JS for the frontend and Nest JS (confusing, I know) with MongoDB for the backend. To set up the development environment, install Node, NPM, the Nest JS CLI, and Docker, clone this repository, and then run the following commands:

```sh
./scripts/init.sh # set up Git hooks and copy .env.example to .env

cd client
npm install # install frontend packages

cd ../server
npm install # install backend packages
```

The pre-commit hook runs all tests, ESLint, and a test build of the frontend. If there are tests that don't pass, any linting errors, or an error during the build of the frontend, the commit will **not** be successful. You can avoid this behavior by adding the -n flag when committing.

To start just the backend and the DB in development, run this command in the `server` directory (runs the backend and the MongoDB Docker container):

```sh
npm run fulldev
```

To start **both** the frontend and the backend, run **the same command** in the `client` directory. That version of the command starts the frontend, the backend, and the DB. Keep in mind that when Handlebars files (`.hbs`) are edited, the dev environment has to be restarted for those changes to take effect.

Go to `localhost:3000` to see the website. Go to `localhost:8081` to open Mongo Express (makes it much easier to work with the database). The username is `admin` and the password is `cc`. `localhost:5000` is used by the backend.

There is an important `shared_helpers` directory in the `client` directory that is used in both `client` and `server`. They both have a `@sh` path alias to it in their respective `tsconfig.json` files. The reason it's in the `client` directory is that Next JS does not support importing files from outside of its root directory, but Nest JS does. You can also find other path aliases in `client/tsconfig.json` and `server/tsconfig.json`.

### Environment

Environment variables are specified in `.env` in the root directory and are automatically sourced by Docker. Simply copy the `.env.example` file, rename it to `.env` (which is not tracked by git in this repo), and change the values of the variables. This works the same way in production and in development.

In development the `server/.env.dev` file is used for environment variables; it is automatically read by Nest JS. The `npm run fulldev` commands copy `.env` to `server/.env.dev` automatically. In production this file is ignored, and the container's environment variables (coming from the `.env` file) are used instead.

Frontend environment variables are specified in the `client/.env.local` file. This file is automatically read by Next JS. See that file for more details. The values are taken from the frontend container's environment variables. These must be set during the container's build process when deploying, because that is when Next JS sets the variables in `.env.local`.

### Starting all containers

To start all containers locally, including the frontend, the backend and the database, run this command:

```sh
./script/start-prod.sh --dev
```

### Data structure

The structure of the different kinds of data (e.g. competitions, rounds, events, etc.) that is stored in the database is determined by the following:

- **Interface** - describes the structure of the data in the DB. Example: `IContest`.
- **DTO interface** - optional; describes the structure of request data. Example: `IPersonDto`.
- **Frontend interface** - optional; describes the structure of the data returned to the frontend. Example: `IFeEvent`.
- **Schema class** - implements the interface and is used to store the data in the DB. Also has a document type in the same file that is used as the return type for documents of that model. If you use VS Code, you can use the `monmod` snippet to create a new schema and the related classes. Use this in your new `.model.ts` files inside of `server/src/models`.
- **Create DTO class** - implements the same interface or a dedicated DTO interface, and is used for validating POST requests that create new documents in the DB.
- **Update DTO class** - extends the create DTO class with a partial extend, and is used for validating PATCH requests.

The structure of many objects like competitions and rounds is mostly similar to the [WCIF specification](https://github.com/thewca/wcif/blob/master/specification.md).