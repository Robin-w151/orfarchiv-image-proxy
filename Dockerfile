FROM denoland/deno:ubuntu

WORKDIR /app

COPY deno.json deno.lock ./

RUN deno install

COPY src/ ./src/

EXPOSE 8080

CMD ["deno", "run", "serve"]
