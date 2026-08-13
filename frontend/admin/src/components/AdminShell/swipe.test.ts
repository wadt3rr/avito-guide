import {describe, expect, it} from 'vitest'
import {resolveDrawerSwipe} from './swipe'

describe('resolveDrawerSwipe', () => {
  it('opens after a right swipe started at the left edge', () => {
    expect(resolveDrawerSwipe({x: 20, y: 100}, {x: 90, y: 112}, false)).toBe('open')
  })

  it('does not open when the swipe starts outside the edge zone', () => {
    expect(resolveDrawerSwipe({x: 40, y: 100}, {x: 120, y: 100}, false)).toBeNull()
  })

  it('closes an open drawer after a left swipe', () => {
    expect(resolveDrawerSwipe({x: 250, y: 100}, {x: 180, y: 112}, true)).toBe('close')
  })

  it('ignores a gesture with excessive vertical movement', () => {
    expect(resolveDrawerSwipe({x: 20, y: 100}, {x: 80, y: 150}, false)).toBeNull()
  })

  it('ignores a gesture shorter than the horizontal threshold', () => {
    expect(resolveDrawerSwipe({x: 20, y: 100}, {x: 70, y: 100}, false)).toBeNull()
  })
})
