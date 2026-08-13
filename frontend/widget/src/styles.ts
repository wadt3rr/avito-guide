export const STYLES = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
}

* { box-sizing: border-box; }

[hidden] { display: none !important; }

.spot {
  position: fixed;
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  pointer-events: none;
  z-index: 1;
}

.catch {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.catch--modal { background: rgba(0, 0, 0, 0.55); }

.tip {
  position: fixed;
  z-index: 2;
  width: min(320px, calc(100vw - 24px));
  padding: 18px;
  background: #fff;
  color: #0f0f0f;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
  font-size: 14px;
  line-height: 1.45;
  opacity: 0;
  transition: opacity .16s ease;
}

.tip[data-ready='1'] { opacity: 1; }

.tip--tooltip::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  transform: rotate(45deg);
}

.tip--tooltip[data-placement='bottom']::after { top: -6px; left: calc(50% - 6px); }
.tip--tooltip[data-placement='top']::after    { bottom: -6px; left: calc(50% - 6px); }
.tip--tooltip[data-placement='right']::after  { left: -6px; top: calc(50% - 6px); }
.tip--tooltip[data-placement='left']::after   { right: -6px; top: calc(50% - 6px); }

.tip--modal {
  top: 50%;
  left: 50%;
  width: min(440px, calc(100vw - 32px));
  transform: translate(-50%, -50%);
}

.tip--banner {
  display: grid;
  grid-template-areas:
    'head actions'
    'body actions';
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 24px;
  row-gap: 2px;
  top: 0;
  left: 0;
  width: 100%;
  padding: 12px 56px 12px 24px;
  border-radius: 0;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
}

.tip--banner .tip__head { grid-area: head; margin: 0; }
.tip--banner .tip__body { grid-area: body; }
.tip--banner .tip__foot { grid-area: actions; margin: 0; }
.tip--banner .tip__close {
  position: absolute;
  top: 12px;
  right: 16px;
}

.tip__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.tip__title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -.2px;
}

.tip__close {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  margin: -4px -4px 0 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #8c8c8c;
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
}

.tip__close:hover { background: #f2f1f0; color: #0f0f0f; }

.tip__body { color: #3d3d3d; }

.tip__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.tip__count {
  flex-shrink: 0;
  font-size: 13px;
  color: #8c8c8c;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tip__actions { display: flex; gap: 8px; }

.tip--tooltip .tip__actions { gap: 4px; }

.tip__actions:only-child { margin-left: auto; }

.btn {
  padding: 8px 16px;
  border: 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}

.tip--tooltip .btn { padding: 8px 10px; }

.btn--primary { background: #00aaff; color: #fff; }
.btn--primary:hover { background: #0092dd; }
.btn--ghost { background: transparent; color: #3d3d3d; }
.btn--ghost:hover { background: #f2f1f0; }

@media (max-width: 480px) {
  .tip {
    width: min(320px, calc(100vw - 24px));
    padding: 16px;
    font-size: 14px;
  }

  .tip--tooltip,
  .tip--modal {
    max-height: calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
  }

  .tip--modal {
    width: calc(100vw - 24px);
  }

  .tip__head,
  .tip__foot {
    flex: 0 0 auto;
  }

  .tip__body {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .tip__close {
    width: 44px;
    height: 44px;
    margin: -10px -10px 0 0;
  }

  .tip__foot {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 10px;
  }

  .tip__actions {
    min-width: 0;
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .btn {
    min-height: 44px;
    padding: 10px 14px;
  }

  .tip--tooltip .btn {
    min-height: 44px;
    padding: 10px 12px;
  }

  .tip--banner {
    grid-template-areas:
      'head'
      'body'
      'actions';
    grid-template-columns: minmax(0, 1fr);
    row-gap: 6px;
    width: 100%;
    max-height: calc(100dvh - env(safe-area-inset-bottom));
    padding:
      max(12px, env(safe-area-inset-top))
      max(40px, calc(12px + env(safe-area-inset-right)))
      max(12px, env(safe-area-inset-bottom))
      max(16px, env(safe-area-inset-left));
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .tip--banner .tip__foot {
    justify-content: flex-start;
    margin-top: 2px;
  }

  .tip--banner .tip__actions {
    justify-content: flex-start;
  }

  .tip--banner .tip__actions:only-child { margin-left: 0; }
  .tip--banner .tip__close { top: 10px; right: 10px; }
}

@media (max-width: 359px) {
  .tip__foot,
  .tip__actions {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }

  .tip__actions:only-child {
    margin-left: 0;
  }

  .btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spot, .tip { transition: none; }
}
`;
