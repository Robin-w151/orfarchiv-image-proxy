import { err, ok, ResultAsync } from 'neverthrow';
import { Buffer } from 'node:buffer';
import sharp from 'sharp';
import { LRUCache } from 'lru-cache';

const COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;
const CACHE = new LRUCache<string, ArrayBuffer>({
  max: 1000,
  maxSize: 512 * 1024 * 1024,
  sizeCalculation: (value) => value.byteLength,
});

type ImageFetchError = { message: string };
const toImageFetchError = (error: unknown) => ({ message: `Failed to fetch image! ${error}` });

type ImageProcessingError = { message: string };
const toImageProcessingError = (error: unknown) => ({ message: `Failed to process image! ${error}` });

export async function fetchAndTransformImage(
  url: string,
  background?: string,
): Promise<ResultAsync<Buffer, ImageProcessingError>> {
  const cached = CACHE.get(url);
  const result = cached ? ok(cached) : await fetchImage(url);

  if (result.isErr()) {
    return err(result.error);
  }

  if (!cached) {
    CACHE.set(url, result.value);
  }

  const processed = await addBackgroundColor(result.value, background);
  if (processed.isErr()) {
    return err(processed.error);
  }

  return ok(processed.value);
}

function fetchImage(url: string): ResultAsync<ArrayBuffer, ImageFetchError> {
  return ResultAsync.fromPromise(fetch(url), toImageFetchError).map((response) => {
    return response.arrayBuffer();
  });
}

function addBackgroundColor(imageData: ArrayBuffer, background?: string): ResultAsync<Buffer, ImageProcessingError> {
  const validBackground = background && COLOR_REGEX.test(background) ? background : '#f3f4f6';
  return ResultAsync.fromPromise(
    sharp(imageData).flatten({ background: validBackground }).toBuffer(),
    toImageProcessingError,
  );
}
