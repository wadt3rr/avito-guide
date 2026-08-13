/** Observes pathname and query changes made by an SPA without polling the location. */
export function watchPathname(onChange: () => void): () => void {
  let path = location.pathname + location.search;
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  const notifyIfChanged = () => {
    const nextPath = location.pathname + location.search;
    if (nextPath === path) return;
    path = nextPath;
    onChange();
  };

  const pushState: History['pushState'] = function (this: History, ...args) {
    originalPushState.apply(this, args);
    notifyIfChanged();
  };
  const replaceState: History['replaceState'] = function (this: History, ...args) {
    originalReplaceState.apply(this, args);
    notifyIfChanged();
  };

  history.pushState = pushState;
  history.replaceState = replaceState;
  window.addEventListener('popstate', notifyIfChanged);

  return () => {
    window.removeEventListener('popstate', notifyIfChanged);
    if (history.pushState === pushState) history.pushState = originalPushState;
    if (history.replaceState === replaceState) history.replaceState = originalReplaceState;
  };
}
