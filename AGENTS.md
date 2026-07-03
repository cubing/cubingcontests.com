# RecordRanks

RecordRanks is a sports organization and ranking system for organizing competitions, managing results, and tracking rankings and records. See `README.md` for full details.

## Project Structure

Monorepo with:

- **Root**: Deployment config (Docker Compose, Caddy, etc.)
- **`bin/`**: scripts
- **`client/`**: full-stack Next.js web application
- **`client/server`**: backend files
- **`client/db`**: DB schema and ORM configuration
- **`client/db/schema`**: table schema files
- **`client/server/server-functions`**: React server functions, with one file for each DB entity and a `server-functions.ts` file for random stuff; each server function ends with the suffix `SF` for clarity and uses `next-safe-action`
- **`client/server/server-only-functions.ts`**: just regular functions (not React server functions) that are only used server-side, due to relying on the DB or other backend tools

## Tech Stack

- **Framework**: Next.js (App Router, RSCs, React Server Functions)
- **Actions**: [next-safe-action](https://next-safe-action.dev/)
- **Backend tools**: Self-hosted Supabase (Postgres, Storage, Logs, Cron)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Package Manager**: [PNPM](https://pnpm.io/) (this repo uses a `package.json5` file instead of `package.json`)
- **Formatting/Linting**: [Biome](https://biomejs.dev/)
- **Styling**: [Bootstrap](https://getbootstrap.com/) (raw CSS classes, no component library)

## Deployment

Self-hostable on any Linux server with Docker. Official instance, called RecordRanks Platform, runs at [app.recordranks.com](https://app.recordranks.com) with multi-tenancy (uses Better Auth Organization plugin). Each organization on the Platform site is called a space. The marketing site at [recordranks.com](https://recordranks.com) shares the same Supabase instance but uses a separate Postgres schema. Third-party RecordRanks instances use their own domains.

## Multi-Tenancy

Supports both multi-tenant mode (multiple sports organizations on one instance) and single-tenant mode. Each organization (space) gets its own URL slug and isolated data in multi-tenant mode.

## Scripts

Custom scripts in `bin/` for production and development tasks (DB migrations, Supabase management, Docker builds, backups). See `README.md` for details.

## Constraints

- **.env files**: Don't try to read the `.env` files, except `.env.example`.
- **Improving AGENTS.md**: If at the end of a significant task you realize that there was additional context you found in the code that you didn't have originally that would be useful for future sessions, you should make recommendations on how to improve it.
- **Documentation**: If you're ever missing context about how a certain technology or plugin works, either do a web search for the documentation or ask for a link directly.
- **Server Components**: When creating Next JS pages, default to using React Server Components for the `page.tsx` files, and only opt into client components when necessary (e.g. for interactivity). But this is not a hard rule.

## Examples

### Component Snippet

Use the following snippet for creating new React components (exclude the comments):

```tsx
type Props = {}; // this is optional; if there are no props, just leave out the type and don't destructure anything in the function

// If it's a Next JS page, call the function [Blank]Page (e.g. ContactPage)
function Component({}: Props) {
  return <></>;
}

export default Component;
```

### Calling Server Function Example

When calling a server function from the client side, this pattern is typically used:

```tsx
import { useState, useContext } from "react";
import { useAction } from "next-safe-action/hooks";
import { MainContext } from "~/helpers/contexts.ts";
import { getActionError } from "~/helpers/utility-functions.ts";
import { createSomethingSF } from "~/server/server-functions.ts";

function Component() {
  const { changeSuccessMessage, changeErrorMessages, resetMessages } = useContext(MainContext);

  const { executeAsync: createSomething, isPending: isCreating } = useAction(createSomethingSF);
  const [state, setState] = useState("");
  const [inputData, setInputData] = useState("");

  const submit = async () => {
    resetMessages();
    const res = await createSomething({ data });

    if (res.serverError || res.validationErrors) {
      changeErrorMessages([getActionError(res)]);
    } else {
      changeSuccessMessage("Successfully created something");
      setState(res.data!); // if there are no errors, assume res.data is defined, unless the server function doesn't return anything
      setData("");
    }
  };

  return /* ... */;
}
```
