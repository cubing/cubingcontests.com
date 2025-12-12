FROM denoland/deno:2.6.0

# Expose port
EXPOSE $NEXTJS_PORT

COPY client /app/client

WORKDIR /app/client

# Prefer not to run as root (THIS DOESN'T WORK FOR SOME REASON!)
# USER deno

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_BASE_URL

RUN deno install --allow-scripts
RUN deno task build

CMD [ "deno", "task", "start" ]
