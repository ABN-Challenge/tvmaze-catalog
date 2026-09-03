import { describe, expect, it } from 'vitest'
import { sanitizeSummaryHtml } from './sanitize'

describe('sanitizeSummaryHtml', () => {
  it('keeps allowed tags and strips scripts/attributes', () => {
    const dirty =
      '<p onclick="alert(1)">Hello <b>world</b><script>evil()</script><a href="x">link</a></p>'
    const clean = sanitizeSummaryHtml(dirty)

    expect(clean).toContain('<p>')
    expect(clean).toContain('<b>world</b>')
    expect(clean).not.toContain('onclick')
    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('<a')
    expect(clean).toContain('link')
  })

  it('returns an empty string for missing summaries', () => {
    expect(sanitizeSummaryHtml(null)).toBe('')
    expect(sanitizeSummaryHtml(undefined)).toBe('')
    expect(sanitizeSummaryHtml('')).toBe('')
  })

  it('keeps the text of nested disallowed tags', () => {
    const clean = sanitizeSummaryHtml('<p><span><em>kept</em> text</span></p>')
    expect(clean).toBe('<p>kept text</p>')
  })

  it('drops comment nodes', () => {
    const clean = sanitizeSummaryHtml('<p>visible<!-- hidden --></p>')
    expect(clean).toBe('<p>visible</p>')
  })

  it('preserves every allowed tag', () => {
    const clean = sanitizeSummaryHtml('<p>a<br><b>b</b><i>c</i><em>d</em><strong>e</strong></p>')
    expect(clean).toBe('<p>a<br><b>b</b><i>c</i><em>d</em><strong>e</strong></p>')
  })

  it('unwraps a disallowed root element', () => {
    expect(sanitizeSummaryHtml('<div>plain</div>')).toBe('plain')
  })
})
