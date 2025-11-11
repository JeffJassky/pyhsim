import type { DivergingScale } from '@/types';

export const createDivergingScale = (domain: [number, number]): DivergingScale => {
  const [min, max] = domain;
  const span = max - min || 1;
  return {
    domain,
    normalize(value: number) {
      return (value - min) / span;
    },
  };
};
