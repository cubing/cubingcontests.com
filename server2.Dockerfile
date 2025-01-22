FROM denoland/deno:2.1.7

# Expose port
EXPOSE $BACKEND2_PORT

COPY server2 /app/server2
COPY shared /app/shared
COPY deno.jsonc /app

WORKDIR /app/server2

# Prefer not to run as root (THIS DOESN'T WORK FOR SOME REASON!)
# USER deno

# Create mock project for the frontend to avoid the Deno "project not found" error
RUN mkdir /app/client && echo "{}" > /app/client/deno.jsonc
RUN deno install

CMD [ "deno", "task", "start" ]