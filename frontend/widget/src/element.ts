
const POLL_INTERVAL_MS = 100;

export function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;

  const style = getComputedStyle(el);
  return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
}

function find(selector: string): HTMLElement | null {
  let el: Element | null;
  try {
    el = document.querySelector(selector);
  } catch {
    return null;
  }
  if (!el || !(el instanceof HTMLElement)) return null;
  return isVisible(el) ? el : null;
}

export function resolveTarget(
  selector: string,
  timeoutMs: number,
  signal: AbortSignal,
): Promise<HTMLElement | null> {
  const immediate = find(selector);
  if (immediate) return Promise.resolve(immediate);
  if (timeoutMs <= 0 || signal.aborted) return Promise.resolve(null);

  return new Promise((resolve) => {
    let done = false;

    const finish = (result: HTMLElement | null) => {
      if (done) return;
      done = true;
      observer.disconnect();
      clearInterval(poll);
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      resolve(result);
    };

    const check = () => {
      const el = find(selector);
      if (el) finish(el);
    };

    const onAbort = () => finish(null);

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
    });

    const poll = setInterval(check, POLL_INTERVAL_MS);
    const timer = setTimeout(() => finish(null), timeoutMs);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

const SCROLL_SETTLE_TIMEOUT_MS = 700;
const SCROLL_POLL_MS = 32;
const SCROLL_POSITION_EPSILON_PX = 0.5;

function isInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

export function scrollIntoView(el: HTMLElement): Promise<void> {
  if (isInViewport(el)) return Promise.resolve();

  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

  return new Promise((resolve) => {
    const startedAt = Date.now();
    let lastTop = Number.NaN;
    let stable = 0;

    const finish = () => {
      clearInterval(timer);
      if (!isInViewport(el)) {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
      resolve();
    };

    const timer = setInterval(() => {
      const top = el.getBoundingClientRect().top;
      stable = Math.abs(top - lastTop) <= SCROLL_POSITION_EPSILON_PX ? stable + 1 : 0;
      lastTop = top;

      if (stable >= 2 || Date.now() - startedAt > SCROLL_SETTLE_TIMEOUT_MS) finish();
    }, SCROLL_POLL_MS);
  });
}
