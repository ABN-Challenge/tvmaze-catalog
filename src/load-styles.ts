import href from './style.css?url'

const id = 'tvmaze-catalog-styles'
if (typeof document !== 'undefined' && !document.getElementById(id)) {
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  // Vite emits `href` as a base-absolute path, which a consuming host would
  // resolve against its own origin. Resolving against this module keeps the
  // stylesheet on the remote's origin.
  link.href = new URL(href, import.meta.url).href
  document.head.appendChild(link)
}
