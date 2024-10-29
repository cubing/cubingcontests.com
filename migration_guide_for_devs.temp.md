# Migration Guide from 0.10 to 0.11

Cubing Contests has just received a major update, though most of the changes only concern the developer experience. Below you will find instructions for migrating to the new dev environment. It should only take around 5-10 minutes.

## Remove the precommit hook setup

This was a bad way to check for build/test errors to begin with. We'll just set up some sort of Github action for the things that the pre-commit hook used to do in the future.

```sh
git config --unset core.hooksPath
```

## Deno

Cubing Contests now uses Deno instead of Node JS for the Next JS application. You should remove your `node_modules` directory from the `client` directory:

```sh
rm -rf ./client/node_modules
```

## Hono

The backend has begun the transition from Nest JS to Hono. You may delete the globally-installed Nest CLI package, it's no longer required:

```sh
npm remove -g @nestjs/cli
```

The new Hono backend lives in the `server2` directory, which will eventually be renamed to `server`, once the Nest JS application is removed. The full migration may take several months, but it will be worth it in the end!

## Environment Variables

Many of the environment variables have been changed. Just create a new `.env` file from `.env.example`, and you should be good to go.

## DB Data

The structure of some DB entities has been changed (see [PR](https://github.com/cubing/cubingcontests.com/pull/62) for more details). You should simply remove your existing Mongo DB Docker volumes and start from scratch.

```sh
docker volume ls
docker volume rm [VOLUME_NAME]
```