FROM denoland/deno:2.1.3

# Expose port
EXPOSE $BACKEND2_PORT

COPY server2 /app/server

WORKDIR /app/server

# Prefer not to run as root (THIS DOESN'T WORK FOR SOME REASON!)
# USER deno

RUN deno install

CMD [ "deno", "task", "start" ]