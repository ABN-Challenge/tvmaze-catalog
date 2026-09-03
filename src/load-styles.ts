import href from './style.css?url'

const id = 'tvmaze-catalog-styles'
if (typeof document !== 'undefined' && !document.getElementById(id)) {
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}
