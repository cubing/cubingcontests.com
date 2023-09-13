# Cubing Contests

This is a place for hosting unofficial Rubik's cube competitions, unofficial events held at WCA competitions, speedcuber meetups, and other unofficial events. It's currently a **work-in-progress**, but eventually this will be an open platform for posting results that anyone will be able to spin up on their own server and use for their own local community. But you can (**and are encouraged to**) use the main instance that will be available to everyone: [**cubingcontests.com**](https://cubingcontests.com/).

## Screenshots

<img src="https://cubingcontests.com/api/cubing_contests_1.jpg" width="300"/>

<img src="https://cubingcontests.com/api/cubing_contests_2.jpg" width="300"/>

<img src="https://cubingcontests.com/api/cubing_contests_3.jpg" width="300"/>

<img src="https://cubingcontests.com/api/cubing_contests_4.jpg" width="300"/>

<img src="https://cubingcontests.com/api/cubing_contests_5.jpg" width="300"/>

<img src="https://cubingcontests.com/api/cubing_contests_6.jpg" width="300"/>

<img src="https://cubingcontests.com/api/cubing_contests_7.jpg" width="300"/>

## Admin features

In order to enable records tracking, the admin has to go to the `Configure record types` page, which can be found on the moderator dashboard (`/mod`), and set the wanted records as active. They can also be given custom labels in order to differentiate them from official WCA records. In order to change a label, the admin must first deactivate the record type, which removes all records from the database, and then change the label and reactivate it, which will set all of the records again. Keep in mind that activating/deactivating a record type is a resource-intensive operation.

In order to post the results for a competition, all new participants must first be entered into the database, which can be done on the `Create new competitor` page.

## Deployment

Please do **NOT** try to deploy your own instance until this project is ready for that (you will find instructions in this section).

## Development

This project uses Next JS for the front-end and Nest JS (confusing, I know) with Mongo DB for the back-end. To set up the development environment, install Node, NPM and Docker, clone this repository and then run the following commands:

```
.githooks/init

cd client
npm install

cd ../server
npm install
```

The pre-commit hook runs all tests and ESLint. If there are tests that don't pass or any linting errors, the commit will **not** be successful.

To start just the backend and the DB in development, run this command in the `server` directory:

```
npm run fulldev
```

To start **both** the frontend and the backend, run **the same command** in the `client` directory. That version of the command starts the frontend, the backend and the DB.

Go to `localhost:3000` to see the website. Go to `localhost:8080` to see Mongo Express (makes it much easier to work with the database). `localhost:5000` is used by the backend.

There is an important `shared_helpers` directory in the `client` directory that is used in both `client` and `server`. They both have a `@sh` path alias to it in their respective `tsconfig.json` files. The reason it's in the `client` directory is that Next JS does not support importing files from outside of its root directory. You can also find other path aliases in `client/tsconfig.json` and `server/tsconfig.json`.

### Environment

DB environment variables are specified in the `.env.dev` file in the root directory and are sourced by Docker Compose (the `fulldev` script in `server/package.json` specifies this file). Note that for production the `.env` file must be used instead, and secure secrets must be used. Set them all to randomly-generated secure passwords; just go with 100 alphanumeric characters as a rule of thumb.

Backend environment variables are specified in the `server/.env.dev` file. This file is automatically read by Nest JS, but only in development; in production that file is ignored.

Frontend environment variables are specified in the `client/.env.local` file. This file is automatically read by Next JS.

### Data structure

The structure of the different kinds of data (e.g. competitions, rounds, events, etc.) that is stored in the database is determined by the following:

- **Interface** - describes the structure of the data in the DB. Example: `ICompetition`, found in `shared_helpers`.
- **Schema class** - implements the interface and is used to store the data in the DB. Also has a document type in the same file that is used as the return type for documents of that model. These are all found in the `server/src/models` directory. **IMPORTANT**: if you use VS Code, use the `monmod` snippet to create a new schema and the related classes. Use this in your new `.model.ts` files inside of `server/src/models`.
- **Create DTO class** - optionally implements the same interface and is used for validating POST requests that create new documents in the DB. May be missing some fields from the interface, if they are not needed on creation. If the class doesn't implement the interface, you have to remember to update the DTO accordingly when updating the interface. Example: `CreateCompetitionDto`.
- **Update DTO class** - extends the create DTO class with a partial extend, and is used for validating PATCH requests. If needed, some fields can be added here to make them editable after the creation of the document. Example: `UpdateCompetitionDto`.
