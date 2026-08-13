import {describe, expect, it} from 'vitest'
import {createEmptyStep} from './scenarios'

describe('createEmptyStep', () => {
  it('keeps user-authored text empty for a new step', () => {
    const step = createEmptyStep(2)

    expect(step.title).toBe('')
    expect(step.text).toBe('')
    expect(step.target).toBe('form-title')
    expect(step.timeout).toBe('5')
  })
})
