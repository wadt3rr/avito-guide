
export type Placement = 'bottom' | 'top' | 'right' | 'left';

export interface Size {
  width: number;
  height: number;
}

export interface Position {
  top: number;
  left: number;
  placement: Placement;
}

const GAP = 12;
const EDGE = 12;

const ORDER: Placement[] = ['bottom', 'top', 'right', 'left'];

function spaceFor(placement: Placement, target: DOMRect, viewport: Size): number {
  switch (placement) {
    case 'bottom':
      return viewport.height - target.bottom;
    case 'top':
      return target.top;
    case 'right':
      return viewport.width - target.right;
    case 'left':
      return target.left;
  }
}

function needFor(placement: Placement, tip: Size): number {
  return (placement === 'bottom' || placement === 'top' ? tip.height : tip.width) + GAP + EDGE;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computePosition(target: DOMRect, tip: Size, viewport: Size): Position {
  const placement =
    ORDER.find((candidate) => spaceFor(candidate, target, viewport) >= needFor(candidate, tip)) ??
    ORDER.reduce((best, candidate) =>
      spaceFor(candidate, target, viewport) > spaceFor(best, target, viewport) ? candidate : best,
    );

  let top: number;
  let left: number;

  if (placement === 'bottom' || placement === 'top') {
    top = placement === 'bottom' ? target.bottom + GAP : target.top - tip.height - GAP;
    left = target.left + target.width / 2 - tip.width / 2;
  } else {
    left = placement === 'right' ? target.right + GAP : target.left - tip.width - GAP;
    top = target.top + target.height / 2 - tip.height / 2;
  }

  return {
    top: clamp(top, EDGE, Math.max(EDGE, viewport.height - tip.height - EDGE)),
    left: clamp(left, EDGE, Math.max(EDGE, viewport.width - tip.width - EDGE)),
    placement,
  };
}
