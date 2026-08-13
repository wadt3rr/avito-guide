import {compile} from 'sass'
import {describe, expect, it} from 'vitest'

describe('AdminShell responsive layout', () => {
  it('reserves the fixed sidebar width for content on desktop only', () => {
    const stylesheetUrl = new URL('./AdminShell.scss', import.meta.url)
    const stylesheetPath = decodeURIComponent(stylesheetUrl.pathname)
      .replace(/^\/([A-Za-z]:\/)/, '$1')
    const stylesheet = compile(stylesheetPath).css

    expect(stylesheet).toMatch(
      /@media \(min-width: 1024px\)[\s\S]*?\.admin-shell__content\s*{[\s\S]*?margin-left: 232px;/,
    )
  })
})
