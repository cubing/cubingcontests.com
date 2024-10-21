FROM denoland/deno:distroless-2.0.2

EXPOSE 3000

COPY client /app/client

WORKDIR /app/client

# Prefer not to run as root
USER deno

ARG API_BASE_URL

ENV ENVIRONMENT=production

RUN deno install
RUN deno task build

CMD [ "deno", "task", "start" ]
