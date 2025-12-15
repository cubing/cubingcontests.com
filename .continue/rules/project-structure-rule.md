---
name: Project Structure
---

# Project Architecture

This is a web application with:

- Next JS app in `/client/` (aliased to `~/`)
- Components in `~/app/components`
- Helper functions, types and Zod validators in `~/helpers`
- Backend in `~/server`
  - Drizzle PostgreSQL schema in `~/server/db`
  - Server functions in `~/server/serverFunctions`, each using the `next-safe-action` library

## Coding Standards

- Use TypeScript for all new files
- Follow the existing naming conventions
