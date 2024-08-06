import Stream from "stream";
import resolvePromiseInChain from "./resolvePromiseInChain";
import { chunkIntoN } from "./chunk";

export type Options = {
  poolSize?: number;
  retryCounter?: number;
  pipes?: { results?: NodeJS.WritableStream; errors?: NodeJS.WritableStream };
};

export function poolToStream<TResult, TInput extends unknown>(
  input: TInput[],
  cb: (item: TInput) => Promise<TResult>,
  options: Options
) {
  const defaultOptions = {
    poolSize: 50,
    retryCounter: 3,
  };
  const optionsWithDefaults = { ...defaultOptions, ...options };

  const processorInput = [...input];

  const resultsStream = new Stream.Readable();
  resultsStream._read = () => {};

  const errorStream = new Stream.Readable();
  errorStream._read = () => {};

  if (options.pipes?.results) {
    resultsStream.pipe(options.pipes.results);
  }

  if (options.pipes?.errors) {
    errorStream.pipe(options.pipes.errors);
  }

  const maxAmount = Math.min(
    processorInput.length,
    optionsWithDefaults.poolSize
  );
  const chunkedProcessorInput = chunkIntoN(processorInput, maxAmount);

  const promises = chunkedProcessorInput.map((chunk) =>
    resolvePromiseInChain(
      chunk,
      cb,
      optionsWithDefaults.retryCounter,
      resultsStream,
      errorStream
    )
  );

  Promise.all(promises).then(() => {
    resultsStream.push(null);
    errorStream.push(null);
  });

  const finished = new Promise<void>(async (resolve) => {
    await Promise.all(promises);
    resolve();
  });

  return {
    resultsStream,
    errorStream,
    finished,
  };
}
