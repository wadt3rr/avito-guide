/**
 * Поиск цели подсказки.
 *
 * Элемента может не быть по трём причинам: страница ещё не отрисовалась,
 * человек ушёл в другой раздел, вёрстку переделали и селектор устарел.
 * Все три выглядят одинаково — элемента нет, — поэтому ждём его появления
 * до таймаута и честно возвращаем null, когда не дождались.
 */

const POLL_INTERVAL_MS = 100;

/** Элемент считается пригодным, только если его реально видно. */
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
    // Селектор из админки может быть синтаксически неверным — это не повод падать.
    return null;
  }
  if (!el || !(el instanceof HTMLElement)) return null;
  return isVisible(el) ? el : null;
}

/**
 * Ждёт появления видимого элемента. Возвращает null, если не дождался
 * или ожидание было прервано.
 */
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

    // Наблюдатель ловит быструю отрисовку, опрос страхует от изменений,
    // которые не порождают мутаций DOM — например, снятия display: none
    // через медиавыражение.
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

/** Как долго ждём остановки прокрутки, прежде чем показать подсказку всё равно. */
const SCROLL_SETTLE_TIMEOUT_MS = 700;
const SCROLL_POLL_MS = 60;

/**
 * Прокручивает цель в зону видимости и ждёт, пока прокрутка успокоится.
 *
 * Намеренно не используем requestAnimationFrame: на скрытой вкладке браузер
 * его не вызывает, и ожидание зависло бы навсегда — человек, переключившийся
 * на другую вкладку, вернулся бы к мёртвому онбордингу. Опрос по таймеру
 * работает и в фоне, а верхняя граница ожидания страхует в любом случае.
 */
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
      // Плавная прокрутка могла не состояться — например, вкладка неактивна
      // или система выключила анимации. Показывать подсказку рядом с целью
      // за пределами экрана нельзя, поэтому доводим прокрутку мгновенно.
      if (!isInViewport(el)) {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
      resolve();
    };

    const timer = setInterval(() => {
      const top = el.getBoundingClientRect().top;
      stable = top === lastTop ? stable + 1 : 0;
      lastTop = top;

      if (stable >= 2 || Date.now() - startedAt > SCROLL_SETTLE_TIMEOUT_MS) finish();
    }, SCROLL_POLL_MS);
  });
}
