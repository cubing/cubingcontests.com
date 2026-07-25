#!/bin/bash

cd "$(dirname "$0")/../client"

pnpm install

pnpm run server-only-off
pnpm run db:migrate
echo # just print a new line in the terminal
pnpm run server-only-on

cd .. || exit 1
