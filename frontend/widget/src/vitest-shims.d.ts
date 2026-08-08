declare module 'vitest' {
  export interface Matchers {
    toBe(expected: unknown): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
  }

  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void | Promise<void>) => void;
  export const expect: <T>(actual: T) => Matchers;
}
