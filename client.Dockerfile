FROM denoland/deno:2.1.7

# Expose port
EXPOSE $FRONTEND_PORT

COPY client /app/client
COPY shared /app/shared
COPY deno.jsonc /app

WORKDIR /app/client

# Prefer not to run as root (THIS DOESN'T WORK FOR SOME REASON!)
# USER deno

ARG API_BASE_URL
ARG API_BASE_URL2

# Create mock project for Hono backend to avoid the Deno "project not found" error
RUN mkdir /app/server2 && echo "{}" > /app/server2/deno.jsonc
RUN deno install --allow-scripts
RUN deno task build
RUN deno run -A npm:next telemetry disable

CMD [ "deno", "task", "start" ]
