import {compile} from 'sass'
import {describe, expect, it} from 'vitest'

describe('UsersPage layout', () => {
  it('anchors user deletion at the right edge and presents the form as a viewport modal', () => {
    const stylesheetUrl = new URL('./UsersPage.scss', import.meta.url)
    const stylesheetPath = decodeURIComponent(stylesheetUrl.pathname)
      .replace(/^\/([A-Za-z]:\/)/, '$1')
    const stylesheet = compile(stylesheetPath).css

    expect(stylesheet).toMatch(/\.user-row\s*{[\s\S]*?position: relative;/)
    expect(stylesheet).toMatch(
      /\.user-row__action\s*{[\s\S]*?position: absolute;[\s\S]*?right: 0;/,
    )
    expect(stylesheet).toMatch(
      /\.users-modal\s*{[\s\S]*?position: fixed;[\s\S]*?inset: 0;/,
    )
  })
})
