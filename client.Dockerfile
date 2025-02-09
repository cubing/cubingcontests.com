FROM denoland/deno:2.1.9

# Expose port
EXPOSE $PORT

COPY client /app/client
RUN rm /app/client/.env.local

WORKDIR /app/client

# Prefer not to run as root (THIS DOESN'T WORK FOR SOME REASON!)
# USER deno

ARG NEXT_PUBLIC_API_BASE_URL

RUN deno install --allow-scripts
RUN deno task build
RUN deno run -A npm:next telemetry disable

CMD [ "deno", "task", "start" ]
