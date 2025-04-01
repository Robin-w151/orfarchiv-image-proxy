import { err, ok, ResultAsync } from 'neverthrow';
import { Buffer } from 'node:buffer';
import sharp from 'sharp';

const COLOR_REGEX = /^#([0-9a-fA-F]{6})$/;

type ImageFetchError = { message: string };
const toImageFetchError = (error: unknown) => ({ message: `Failed to fetch image! ${error}` });

type ImageProcessingError = { message: string };
const toImageProcessingError = (error: unknown) => ({ message: `Failed to process image! ${error}` });

export async function fetchAndTransformImage(
  url: string,
  background?: string,
): Promise<ResultAsync<Buffer, ImageProcessingError>> {
  const result = await fetchImage(url);

  if (result.isErr()) {
    return err(result.error);
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
