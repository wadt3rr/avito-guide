/**
 * Стили живут строкой и уезжают внутрь Shadow DOM. Наружу они не протекают,
 * а стили сайта-хозяина не достают до подсказки.
 */
export const STYLES = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
}

* { box-sizing: border-box; }

.spot {
  position: fixed;
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  transition: top .18s ease, left .18s ease, width .18s ease, height .18s ease;
  pointer-events: none;
  z-index: 1;
}

.catch {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.tip {
  position: fixed;
  z-index: 2;
  width: 320px;
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

.tip::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  transform: rotate(45deg);
}

.tip[data-placement='bottom']::after { top: -6px; left: calc(50% - 6px); }
.tip[data-placement='top']::after    { bottom: -6px; left: calc(50% - 6px); }
.tip[data-placement='right']::after  { left: -6px; top: calc(50% - 6px); }
.tip[data-placement='left']::after   { right: -6px; top: calc(50% - 6px); }

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
  font-size: 13px;
  color: #8c8c8c;
  font-variant-numeric: tabular-nums;
}

.tip__actions { display: flex; gap: 8px; }

.btn {
  padding: 8px 16px;
  border: 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}

.btn--primary { background: #00aaff; color: #fff; }
.btn--primary:hover { background: #0092dd; }
.btn--ghost { background: transparent; color: #3d3d3d; }
.btn--ghost:hover { background: #f2f1f0; }

@media (prefers-reduced-motion: reduce) {
  .spot, .tip { transition: none; }
}
`;
