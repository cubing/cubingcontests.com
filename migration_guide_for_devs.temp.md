# Remove the precommit hook setup

This was a bad way to do it to begin with. We'll just set up some sort of Github action for the things that the pre-commit hook used to do.

```sh
git config --unset core.hooksPath
```

# Deno

Cubing Contests now uses Deno instead of Node.

# Hono

The backend has begun the transition from Nest JS to Hono.

You may delete the globally-installed Nest CLI package, it's no longer required.

```sh
npm remove -g @nestjs/cli
```

# Environment Variables

