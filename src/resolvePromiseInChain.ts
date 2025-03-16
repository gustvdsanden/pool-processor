import Stream from "stream";

export default async function resolvePromiseInChain<
  TResult,
  TInput extends unknown
>(
  chunk: TInput[],
  cb: (item: TInput) => Promise<TResult>,
  retriesLeft: number,
  resultsStream?: Stream.Readable,
  errorStream?: Stream.Readable
): Promise<void> {
  const remainingChunk = [...chunk];

  const currentItem = remainingChunk.shift();
  if (!currentItem) {
    return;
  }

  try {
    const result = await cb(currentItem);
    resultsStream?.push(JSON.stringify({ item: currentItem, result }));

    if (remainingChunk.length > 0) {
      await resolvePromiseInChain(
        remainingChunk,
        cb,
        retriesLeft,
        resultsStream,
        errorStream
      );
    }
  } catch (error: any) {
    errorStream?.push(
      JSON.stringify({ item: currentItem, retriesLeft, error: error.message })
    );
    const decreasedRetryCounter = retriesLeft - 1;
    if (decreasedRetryCounter >= 0) {
      await resolvePromiseInChain(
        [currentItem],
        cb,
        decreasedRetryCounter,
        resultsStream,
        errorStream
      );
    }
  }
}
