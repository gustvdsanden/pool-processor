import { poolToStream } from "../src/index.ts";
import stream from "stream";

const input = Array.from({ length: 1000 }, (_, i) => i);
const cb = async (item: number) => {
  return item;
};

const test = new stream.Writable();
test._write = (chunk: any, encoding: string, done: () => void) => {
  console.log(chunk.toString(), encoding);
  done();
};

poolToStream(input, cb, {
  pipes: { results: test },
});
