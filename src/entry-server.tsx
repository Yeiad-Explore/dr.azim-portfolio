import { renderToString } from 'react-dom/server'
import App from './App'

// Rendered at build time into dist/index.html so the page is complete
// editorial longform before any JavaScript runs. renderToString (not
// renderToStaticMarkup) keeps the text-node markers hydrateRoot needs.
export function render() {
  return renderToString(<App />)
}
