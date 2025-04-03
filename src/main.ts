import { Context, Hono } from 'hono';
import { cache } from 'hono/cache';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { fetchAndTransformImage } from './image-processing.ts';

if (import.meta.main) {
  const app = new Hono();
  app.use(logger());
  app.use(
    '*',
    cache({
      cacheName: 'image-proxy',
      cacheControl: 'max-age=3600',
      wait: true,
    }),
  );
  app.get('/', handleImageRequest);
  Deno.serve({ port: 8080 }, app.fetch);
}

async function handleImageRequest(ctx: Context) {
  const imageUrl = ctx.req.query('url');
  if (!imageUrl) {
    throw new HTTPException(400, {
      message: 'Missing image URL!',
    });
  }

  const background = ctx.req.query('background');
  const result = await fetchAndTransformImage(imageUrl, background ?? undefined);
  if (result.isErr()) {
    logError(result.error, ctx);

    throw new HTTPException(500, {
      message: 'Failed to load image!',
    });
  }

  ctx.header('Content-Type', 'image/webp');
  return ctx.body(result.value);
}

function logError({ message }: { message: string }, ctx: Context) {
  console.group(message);
  console.info(ctx.req);
  console.groupEnd();
}
