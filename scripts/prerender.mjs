// Injects the statically rendered app into dist/index.html.
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const dist = resolve('dist')
const ssrEntry = resolve('dist-ssr/entry-server.js')

const { render } = await import(pathToFileURL(ssrEntry).href)
const html = readFileSync(resolve(dist, 'index.html'), 'utf8')
const markup = render()

if (!html.includes('<div id="root"></div>')) {
  throw new Error('prerender: could not find the empty root div in dist/index.html')
}

writeFileSync(
  resolve(dist, 'index.html'),
  html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`),
)

rmSync(resolve('dist-ssr'), { recursive: true, force: true })
console.log(`prerendered ${markup.length} bytes into dist/index.html`)
