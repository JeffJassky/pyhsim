export const clamp = (value: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) =>
  Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export const gaussian = (x: number, center: number, width: number) =>
  Math.exp(-Math.pow((x - center) / width, 2));

export const softplus = (x: number) => Math.log1p(Math.exp(x));

export const tanh = (x: number) => Math.tanh(x);

export function rollingAverage(values: number[], window: number) {
  if (window <= 1) return values.slice();
  const half = Math.floor(window / 2);
  return values.map((_, idx, arr) => {
    const start = Math.max(0, idx - half);
    const end = Math.min(arr.length, idx + half + 1);
    const slice = arr.slice(start, end);
    return slice.reduce((sum, val) => sum + val, 0) / slice.length;
  });
}
