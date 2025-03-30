import { Context, Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { fetchAndTransformImage } from './image-processing.ts';

if (import.meta.main) {
  const app = new Hono();
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
    log(result.error.message, ctx);

    throw new HTTPException(500, {
      message: 'Failed to load image!',
    });
  }

  ctx.header('Content-Type', 'image/webp');
  return ctx.body(result.value);
}

function log(message: string, ctx: Context) {
  console.group(message);
  console.info(ctx.req);
  console.groupEnd();
}
