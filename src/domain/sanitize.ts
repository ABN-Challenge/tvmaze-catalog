const ALLOWED_TAGS = new Set(['p', 'br', 'b', 'i', 'em', 'strong'])

/** Strip tags/attributes outside a small allow-list for TVmaze HTML summaries. */
export function sanitizeSummaryHtml(html: string | null | undefined): string {
  if (!html) return ''

  const template = document.createElement('template')
  template.innerHTML = html

  const walk = (node: Node) => {
    const children = [...node.childNodes]
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        const tag = el.tagName.toLowerCase()
        if (!ALLOWED_TAGS.has(tag)) {
          // An element's textContent is always a string, never null.
          const text = document.createTextNode(el.textContent as string)
          el.replaceWith(text)
          continue
        }
        for (const attr of [...el.attributes]) {
          el.removeAttribute(attr.name)
        }
        walk(el)
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.parentNode?.removeChild(child)
      }
    }
  }

  walk(template.content)
  return template.innerHTML
}
