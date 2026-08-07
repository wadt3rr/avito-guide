import { useEffect } from 'react';

type Facts = Record<string, string>;

interface OnboardingApi {
  identify(facts: Facts): void;
  start(): Promise<void>;
}

declare global {
  interface Window {
    AvitoOnboarding?: OnboardingApi;
  }
}

export function useOnboardingContext(facts: Facts): void {
  const serialized = JSON.stringify(facts);

  useEffect(() => {
    const api = window.AvitoOnboarding;
    if (!api) return;

    api.identify(JSON.parse(serialized) as Facts);
    void api.start();
  }, [serialized]);
}
