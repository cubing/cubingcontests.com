FROM denoland/deno:distroless-2.0.2

EXPOSE $BACKEND2_PORT

COPY server2 /app/server

WORKDIR /app/server

# Prefer not to run as root
USER deno

CMD [ "deno", "task", "start" ]