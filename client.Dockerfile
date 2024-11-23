FROM denoland/deno:2.1.1

# Expose port
EXPOSE $FRONTEND_PORT

COPY client /app/client

WORKDIR /app/client

# Prefer not to run as root (THIS DOESN'T WORK FOR SOME REASON!)
# USER deno

ARG API_BASE_URL
ARG API_BASE_URL_SERVER_SIDE
ARG API_BASE_URL2
ARG API_BASE_URL2_SERVER_SIDE

RUN deno install
RUN deno task build

CMD [ "deno", "task", "start" ]
