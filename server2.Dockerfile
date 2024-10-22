FROM denoland/deno:distroless-2.0.2

COPY server2 /app/server

WORKDIR /app/server

EXPOSE $BACKEND2_PORT