export interface Point {
  x: number
  y: number
}

const EDGE = 24
const DISTANCE = 56
const VERTICAL_LIMIT = 32

export function resolveDrawerSwipe(
  start: Point,
  end: Point,
  drawerOpen: boolean,
): 'open' | 'close' | null {
  const horizontalDistance = end.x - start.x
  const verticalDistance = Math.abs(end.y - start.y)

  if (verticalDistance > VERTICAL_LIMIT) return null
  if (!drawerOpen) {
    return start.x <= EDGE && horizontalDistance >= DISTANCE ? 'open' : null
  }
  return horizontalDistance <= -DISTANCE ? 'close' : null
}
