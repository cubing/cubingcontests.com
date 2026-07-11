# RecordRanks

[RecordRanks](https://recordranks.com/) is a sports organization and ranking system. It's a web application that provides tools for organizing competitions for different kinds of competitive sports, selecting events (fully customizable), writing rules, managing competitor information, entering live results, and automated global rankings and records for each event. It also has support for user roles for streamlined moderation to ensure the integrity of the results, it supports results submitted with video evidence, and it supports World, continental and national records, including for team events.

RecordRanks can be deployed on any Linux server and runs as a web application, with self-hosted Supabase providing the database, logs, storage, cron, and a rich suite of system administration tools. It also automates the creation of daily backups of DB data.

## Support the project

Deni Mintsaev is the main developer of RecordRanks, and all contributions go directly towards the development of the project. You can support the project on Ko-fi:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S11WPJA3)

## Screenshots

Below are some screenshots from one of the RecordRanks instances: [Cubing Contests](https://cubingcontests.com/) (a lot of this is mock data). This was the first instance of RecordRanks.

<img src="https://codeberg.org/mintydev/RecordRanks/raw/branch/main/client/public/screenshots/contest_results.jpg" width="500"/>

<img src="https://codeberg.org/mintydev/RecordRanks/raw/branch/main/client/public/screenshots/records.jpg" width="500"/>

<img src="https://codeberg.org/mintydev/RecordRanks/raw/branch/main/client/public/screenshots/rankings.jpg" width="500"/>

<img src="https://codeberg.org/mintydev/RecordRanks/raw/branch/main/client/public/screenshots/mod_dashboard.jpg" width="500"/>

<img src="https://codeberg.org/mintydev/RecordRanks/raw/branch/main/client/public/screenshots/data_entry.jpg" width="500"/>

<img src="https://codeberg.org/mintydev/RecordRanks/raw/branch/main/client/public/screenshots/competitors.jpg" width="500"/>

## Deployment

To deploy an instance of RecordRanks, you have to first set up a Linux server and obtain a custom domain name. You'll also need a [Dockerhub](https://hub.docker.com/) account to host your custom Docker images. Then, you can follow this guide to publish your custom RecordRanks image and deploy it on your server.

### Environment variables

You will have to set up a local `.env` file for releasing your Docker image and another one on your server, which will contain all of your secrets. Note that you **MUST NOT** use your local `.env` file or the `.env.example` file in production, because using the default values will leave your instance **completely exposed**. To set up a local `.env` file, follow these steps:

1. Create `.env` file: `cp .env.example .env`.
2. Set `PROD_HOSTNAME` to your custom domain name without the protocol (e.g. `mysportsproject.com`).
3. Set `SUPABASE_HOSTNAME` to your Supabase hostname without the protocol (e.g. `supabase.mysportsproject.com`).
4. Set `NEXT_PUBLIC_PROJECT_NAME` to your project name (e.g. `My Sports Project`).
5. Set `PROJECT_ID` to an alphanumeric ID for your project, in lowercase (e.g. `mysportsproject`).
6. Set `NEXT_PUBLIC_AUTH_PROVIDERS` to the authentication methods you would like to use (comma-separated).
7. Set your Dockerhub username in `DOCKER_IMAGE_NAME` (e.g. `dockerhubuser/$PROJECT_ID-nextjs`).

To set up a production `.env` file, follow these steps:

1. Create `.env` file: `cp .env.example .env`.
2. Generate secure secret keys for Supabase: `./bin/supabase-generate-keys.sh`.
3. Comment out all variables marked with `for local development` and uncomment variables marked with `for production`.
4. Set `RR_DB_USERNAME` to a custom username for the DB user.
5. Set `RR_DB_PASSWORD` to a secure password.
6. Set `BETTER_AUTH_SECRET` to a secure secret.
7. Set `PROD_HOSTNAME` to your custom domain name without the protocol (e.g. `mysportsproject.com`).
8. Set `PROJECT_ID` to an alphanumeric ID for your project, in lowercase (e.g. `mysportsproject`).
9. Optionally, set the `METADATA_...` values for SEO and the `ANALYTICS_...` values for analytics.
10. Set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USERNAME` and `EMAIL_PASSWORD` to your transactional email credentials.
11. Set your Dockerhub username in `DOCKER_IMAGE_NAME` (e.g. `dockerhubuser/$PROJECT_ID-nextjs`).

\* Note: for [WCA OAuth](https://www.worldcubeassociation.org/oauth/applications) you will have to set these values when you set it up in your WCA OAuth settings:

- Name: (same as `NEXT_PUBLIC_PROJECT_NAME`)
- Redirect URI: `https://<PROD_HOSTNAME>/api/auth/oauth2/callback/wca`
- Scopes: `public openid email profile`

### Icon

To generate an icon, place an `icon.svg` file in the `client` directory (this file is git-ignored). The ICO file will be generated automatically when the Docker image is built and included in the image. The icon file can also be called `icon.<PROJECT_ID>.svg` (use the `PROJECT_ID` value from your `.env` file).

### Down for maintenance page

Caddy uses the `down-for-maintenance-page.html` file at the root of the repo as the fallback for when the Next JS application is down. This file is git-ignored, as it's supposed to be unique to each RecordRanks instance. Copy the example file on your deployed server and edit it to fit your instance. You can use this command:

```sh
cp down-for-maintenance-page.html.example down-for-maintenance-page.html
```

### `robots.txt` file

There is an example `robots.txt` at `client/app/robots.txt.example`. You can copy that file to `client/app/robots.txt` and edit it to define a list of paths you would like to prevent web crawlers from indexing. Learn more about this [here](https://www.robotstxt.org/robotstxt.html).

### Creating the Docker image

Once you have a [Dockerhub](https://hub.docker.com/) account, you can publish your Docker image using the script (see the Scripts section).

### DNS records

Before you deploy the instance, you will have to set up your DNS records:

1. Set up `A`, `AAAA` and `NS` records to point from your domain name to your server.
2. Set up `A`, `AAAA` and `NS` records to point from `supabase.yourdomainname.com` to your server.
3. Set up records to enable email sending using your domain name (follow the instructions from your transactional email provider\*).
4. If you would like to use a custom email address using your domain name, set up the records for that (follow the instructions from your email service provider\*).

\* Note: a transactional email provider is not the same as an email service provider; the former enables you to send automated emails from your domain name (e.g. no-reply@yourdomainname.com), while the latter enables you to create an email inbox, often with the ability to set up a custom domain name (e.g. inquiries@yourdomainname.com).

The `docker-compose.rr.yml` file includes a Caddy reverse proxy, which handles proxying for both Next JS and Supabase.

### Firewall

If you're using a firewall on your server, make sure the following ports are not being blocked: `80`, `443`, `443/udp`, <the port from `EMAIL_PORT`>.

### Starting production server

To deploy your RecordRanks instance, you will have to install the following dependencies on your Linux server: `git`, `docker`, `node`, `pnpm` and `rsync` (for backups). It is also recommended that you [set up a better logging driver](https://docs.docker.com/engine/logging/configure/) for Docker. Here's an example `/etc/docker/daemon.json` file you could use for your server (don't forget to restart Docker and any running containers after setting it up):

```json
{
  "log-driver": "local",
  "log-opts": {
    "mode": "non-blocking"
  }
}
```

There are two Docker Compose files used for deploying an instance: one for starting Supabase and one for starting RecordRanks. Run the following command to start Supabase:

```sh
docker compose -f docker-compose.supabase.yml up -d
```

The Scripts section shows how to start RecordRanks.

### Supabase

RecordRanks instances run alongside self-hosted Supabase, which provides the database, blob storage, a sysadmin dashboard (Supabase Studio), and more. The credentials for accessing Supabase Studio are in the `.env` file. Note that the Auth, Edge Functions and PostgREST modules are excluded in the self-hosted Supabase configuration in this project.

#### RecordRanks settings

RecordRanks is designed to be customizable, allowing certain features to be enabled or disabled. The values in the `settings` table can be edited directly to customize some of the functionality of the instance. Only edit the `value` column (keep in mind the values cannot be `null`). The `description` column includes descriptions for each setting.

#### Blog

There is a simple blog feature, but it currently has no UI for creating posts within RecordRanks itself. For now, blog posts can be published directly using the `posts` table. A post has the following schema:

- `postId`: a unique text ID for the post; this is used in the URL for the post (e.g. `our-first-announcement`)
- `title`: the title of the post, shown at the top of the page
- `content`: the content of the post (Markdown supported)
- `date`: the date of the post (this doesn't have to be the same as the creation date; `createdAt` is a separate auto-generated column)
- `createdBy`: the user ID of the author; it's expected that there is a person tied to the user (get this value from the `users` table)

#### Logs

Supabase Logs contains logs for both the Supabase services and the RecordRanks application. There is a snippet in SQL Editor that can be copied over to Supabase Logs to view RecordRanks logs. The snippet also contains the instructions for this.

Note that RecordRanks simply uses the existing Edge Functions sink for internal logs, but this project excludes the Edge Functions module in the self-hosted Supabase configuration.

#### Storage

Blob storade is used for hosting public image files (although you can also use it for other files). Follow these instructions to set up a storage bucket for your public assets:

1. Create a public bucket with the name `public_bucket`.
2. Create a policy using the template "Give access to a nested folder called admin/assets only to a specific user" and set it up like this:

- **Policy name**: Give access to assets folder
- **Allowed operation**: (select all)
- **Target roles**: authenticated
- **Policy definition**: `bucket_id = 'public_bucket' AND (storage.foldername(name))[1] = 'assets' AND (select auth.uid()::text) = '<LEAVE PRE-FILLED USER ID>'`

3. Create an `assets` folder at the root of the bucket.

You can then place any assets you want to be publicly accessible via the URL in that folder. If you would like to have link image previews for certain pages, you can create an `assets/screenshots` folder and place the screenshots there. Search for `screenshots/` in the codebase to see which pages have link image previews.

#### Public exports

To enable automatic public exports that run at regular intervals, you have to set up a cron job with Supabase:

1. Open Supabase Studio and go to Integrations -> Vault -> Secrets.
2. Add secret `service_role_key` with the value being the same as `SERVICE_ROLE_KEY` in your production `.env` file.
3. Add secret `base_url` with the value `https://<PROD_HOSTNAME>` (use your production hostname value).
4. Go to SQL Editor and run the query "Schedule public export cron job".
5. Go to the `settings` table in Table Editor and set the `public-exports-to-keep` value to a number above 0.

**NOTE**: while this cron job will be visible in Integrations -> Cron, it cannot be edited directly, due to the complex value of the authorization header; only activated and deactivated. To change the cron job, delete it and create it again following step 4.

To test this locally, run the local dev environment and then use this command:

```sh
# Make sure to replace <NEXTJS_PORT> with your Next JS container port (3000 by default)
curl -X POST -H "Authorization: Bearer <SERVICE_ROLE_KEY>" http://localhost:<NEXTJS_PORT>/api/export/create-public-export
```

For debugging you can look at the history of cron job runs in Integrations -> Cron and at the contents of the `net` schema in Table Editor.

The export files can be imported with Supabase, but keep in mind that they don't include the data for some internal columns, including `organization_id`. The import process for each table is as follows:

1. Go to "SQL Editor" and run the "Public exports pre-import helper" snippet (THIS DELETES DATA).
2. Go to "Table Editor" and select schema `record_ranks`.
3. Click "Insert" -> "Import data from CSV" -> select the CSV file -> "Import data".
4. Go to "SQL Editor" and run the "Public exports post-import helper" snippet.

Note: due to limitations with the CSV format, empty string values are represented as `__EMPTY_STRING__`. You can (and should) safely change those values to `""` (empty string), if you find any.

## Scripts

There are several custom scripts located in the `bin` directory. These should be executed from the root of the project with `./bin/<script>`.

| Script                      | Description                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `start-prod.sh`             | Start RecordRanks in production. If it's already running, add `-r` to restart it instead.                   |
| `apply-db-migrations.sh`    | Apply DB migrations using Drizzle Kit. Also handles disabling `"server-only"` while Drizzle Kit is running. |
| `supabase-reset.sh`         | Reset Supabase (remove containers and delete DB data and storage).                                          |
| `supabase-generate-keys.sh` | Generate Supabase secret keys. This is REQUIRED for production!                                             |
| `release-new-version.sh`    | Release new version of RecordRanks (pushes to Codeberg).                                                    |
| `release-new-image.sh`      | Create Docker image for the Next JS app and publish it.                                                     |
| `create-full-backup.sh`     | Create encrypted backup of the Supabase database and storage.                                               |

There is also a `convert-svg-to-ico.sh` script in the `client` directory to convert an SVG file with the icon to an ICO file at `client/app/favicon.ico`. This script runs automatically on Docker image build.

## Development

This project uses Next JS as a full-stack web application and self-hosted Supabase for various backend utilities. These instructions assume you're using Linux (or WSL). To set up the development environment, install Node, PNPM and Docker, and then follow these steps:

1. Create a `.env` file: `cp .env.example .env` (skip this step if you already have a `.env` file; **DO NOT** use the example `.env` in production!)
2. Start Supabase: `docker compose -f docker-compose.supabase.yml up -d`
3. Apply DB migrations: `./bin/apply-db-migrations.sh` (skip this step if there are no new migrations since last time)
4. `cd client`
5. Start Next JS: `pnpm dev`

Note that Next JS accesses the variables in `.env` through the `client/.env` symlink, which means that it won't be able to detect changes made to the source file. If you change any values in `.env`, simply restart `pnpm dev`.

This repo uses Biome for formatting and linting. If you intend to contribute code to this repo, please install the Biome extension for your IDE and set it up as your default formatter.

Go to `localhost:3000` to see the website. Go to `localhost:8000` to open Supabase Studio. The default username is `supabase` and the password is `rr` (you can see this in the `.env` file). The default ports can be overridden in the `.env` file.

Global constants are located in `constants.ts`. Keep in mind that some features are only enabled for the Cubing Contests instance (via the `IS_CUBING_CONTESTS_INSTANCE` constant).

Please note that some Supabase features, like analytics and cron only work in a production environment. To stop Supabase, use this command:

```sh
docker compose -f docker-compose.supabase.yml down
```

### Mock data

If your DB is empty, the backend will fill the events table with the data from `eventsStub.ts`. It will also seed some test data from `client/helpers/test-data`. This includes users `admin`, `mod` and `user`, all with the password `rr`.

### Accessing DB container directly

To access the DB container with admin privileges directly, use this command (make sure to use the values from `.env`):

```sh
docker exec -it supabase-db psql postgresql://supabase_admin:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}
```

### Testing email sending

To test email sending, use [Smtp4Dev](https://smtp4dev.com/) locally:

```sh
docker compose -f docker-compose.smtp4dev.yml up -d
```

Make sure your email environment variables are set to the following values:

```sh
EMAIL_HOST="localhost"
EMAIL_PORT=25
EMAIL_USERNAME=""
EMAIL_PASSWORD=""
```

## API endpoints

### Events

To get the list of events, use the endpoint below:

```
/api/[slug]/events

slug (optional) = URL slug for the space (this parameter can be omitted to use the default space)
```

### Rankings

To get the rankings, use the endpoint below:

```
/api/[slug]/results/rankings/[eventId]/[type]/[category]?show=[show]&region=[region]&topN=[topN]

slug (optional)   = URL slug for the space (this parameter can be omitted to use the default space)
eventId           = ID of the event
type              = "single" for top single rankings; "average" for top average rankings; "all-avg-formats" for top average rankings, including Mo3 and Ao5 formats
category          = record category; accepts values: "competitions" | "meetups" | "online" | "all"
show (optional)   = "persons" for top persons rankings (default); "results" for top results rankings
region (optional) = region (shows World rankings if omitted); accepts values: 2 letter country ISO code | "XF" | "XA" | "XE" | "XO" | "XN" | "XS" (continent codes)
topN (optional)   = how many top results to return; number between 1 and 100,000; defaults to 100
```

### External data entry

Results can be entered directly via the API. This can be used to enter results into a RecordRanks instance programmatically from a third-party website or an external data entry device. The schema is mostly the same as the [WCA Live API](https://github.com/thewca/wca-live/wiki/Entering-attempts-with-external-devices), but a space can be specified and the selection of the competitor is different. You can either use `registrantId`, which is the unique numerical ID of the competitor in the database, or `wcaId`, which is an alphanumeric ID from the [WCA website](https://www.worldcubeassociation.org/) (only relevant for speedcubing competitions). For team events `registrantId` should be provided as a string containing comma-separated integers; `wcaId` should be provided as a string containing comma-separated WCA IDs. The order of the competitors is significant.

API keys can be generated on the API keys page (accessible via the Mod Dashboard). All access tokens remain valid until the contest is finished or deleted. Once you have a key, authorize your API requests with the `x-api-key` HTTP header.

#### Entering a single attempt

```
POST /api/enter-attempt

JSON payload: {
  // "spaceId": "my_space", // URL slug for the space; defaults to "default"; only required for RR instances with multi-tenancy
  "competitionId": "MyCompetition2023",
  "eventId": "fto",
  "roundNumber": 1,
  // Use one of these two options
  "registrantId": 1, // or "registrantId": "1,2,3" for a team event
  // "wcaId": "2005DEMO01", // or "wcaId": "2005DEMO01,2005DEMO02" for a team event
  "attemptNumber": 1,
  "attemptResult": 1025
}
```

#### Entering multiple attempts and results

**WIP**

<!--
```
POST /api/enter-results

JSON payload: {
  // "spaceId": "my_space", // only required for RR instances with multi-tenancy enabled; defaults to "default"
  "competitionId": "MyCompetition2023",
  "eventId": "fto",
  "roundNumber": 1,
  "results": [{
    "registrantId": 5, // multiple IDs may be provided for team events, like in /enter-attempt
    "attempts": [
      { "result": 1025 },
      { "result": 1100 },
      { "result": 1265 },
      { "result": 1010 },
      { "result": 905 }
    ]
  }, {
    "wcaId": "2005DEMO01", // multiple WCA IDs may be provided for team events, like in /enter-attempt
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
-->

### Healthcheck

To see the current healthcheck status, use the endpoint below:

```
/api/healthcheck
```
