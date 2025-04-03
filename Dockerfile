FROM denoland/deno:ubuntu AS builder
WORKDIR /app
COPY . .
RUN deno cache src/main.ts

FROM denoland/deno:ubuntu AS runner
WORKDIR /app
COPY --from=builder /app .
EXPOSE 8080
CMD ["deno", "run", "serve"]
