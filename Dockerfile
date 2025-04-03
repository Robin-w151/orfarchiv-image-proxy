FROM denoland/deno:ubuntu AS builder

WORKDIR /app

COPY . .

RUN deno cache src/main.ts


FROM denoland/deno:ubuntu AS runner

RUN addgroup --system app && adduser --system --ingroup app app

WORKDIR /app

COPY --from=builder --chown=app:app /app .

USER app

EXPOSE 8080

CMD ["deno", "run", "serve"]
