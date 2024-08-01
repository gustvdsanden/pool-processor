import { chunkIntoN } from "./chunk";

export type Callback<TResult> = (input: Input) => Promise<TResult>;
export type Input = Record<string, any> | string | number | boolean;
export type Options = { poolSize: number; retryCounter: number };
export type InputWithRetryCounter = Input & { retryCounter: number };

export async function poolProcessor<TResult>(
  input: Input[],
  cb: (item: Input) => Promise<TResult>,
  options: Options = {
    poolSize: 50,
    retryCounter: 3,
  }
) {
  const processorInput: InputWithRetryCounter[] = input.map((item) =>
    typeof item === "object"
      ? { ...item, retryCounter: 0 }
      : { item, retryCounter: 0 }
  );

  const maxAmount = Math.min(processorInput.length, options.poolSize);
  const chunkedProcessorInput = chunkIntoN(processorInput, maxAmount);

  const promises = chunkedProcessorInput.map((chunk) =>
    resolvePromiseInChain(chunk, cb, options.retryCounter)
  );

  return (await Promise.all(promises)).flat();
}

async function resolvePromiseInChain<TResult>(
  chunk: InputWithRetryCounter[],
  cb: (item: Input) => Promise<TResult>,
  retryCounter: number
): Promise<TResult[]> {
  const remainingChunk = [...chunk];
  const results: TResult[] = [];

  const currentItem = remainingChunk.shift();
  if (!currentItem) {
    return results;
  }

  const result = await cb(currentItem);
  results.push(result);

  if (remainingChunk.length > 0) {
    const result2 = await resolvePromiseInChain(
      remainingChunk,
      cb,
      retryCounter
    );
    results.push(...result2);
  }

  return results;
}
