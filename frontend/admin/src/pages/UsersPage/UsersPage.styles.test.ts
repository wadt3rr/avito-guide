import {compile} from 'sass'
import {describe, expect, it} from 'vitest'

describe('UsersPage layout', () => {
  it('shows deletion as a standalone button and moves it to the mobile card corner', () => {
    const stylesheetUrl = new URL('./UsersPage.scss', import.meta.url)
    const stylesheetPath = decodeURIComponent(stylesheetUrl.pathname)
      .replace(/^\/([A-Za-z]:\/)/, '$1')
    const stylesheet = compile(stylesheetPath).css

    expect(stylesheet).toMatch(/\.user-row\s*{[\s\S]*?position: relative;/)
    const desktopAction = stylesheet.match(/\.user-row__action\s*{([^}]*)}/)?.[1] ?? ''
    expect(desktopAction).toContain('position: absolute')
    expect(desktopAction).not.toContain('background:')
    expect(desktopAction).not.toContain('border-left:')
    expect(stylesheet).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.user-row__action\s*{[\s\S]*?top: 12px;[\s\S]*?right: 12px;[\s\S]*?bottom: auto;/,
    )
    expect(stylesheet).toMatch(
      /\.users-modal\s*{[\s\S]*?position: fixed;[\s\S]*?inset: 0;/,
    )
  })
})
