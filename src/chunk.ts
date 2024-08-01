export function chunkIntoN<T>(arr: T[], chunkAmount: number) {
  const size = Math.ceil(arr.length / chunkAmount);
  return Array.from({ length: chunkAmount }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}
