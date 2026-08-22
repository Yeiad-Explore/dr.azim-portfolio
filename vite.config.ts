import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

// Vite has no concept of serverless functions, so `npm run dev` would serve the
// site but 404 on /api/chat — the assistant would report itself unavailable
// forever and look broken. This mounts the real api/chat.ts handler on the dev
// server so one command runs the whole thing, and dev exercises the same code
// path production does. Serve-only: it is never part of a build.
function apiRoutes(env: Record<string, string>): Plugin {
  return {
    name: 'local-api-routes',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      // The function reads process.env; loadEnv gives us .env without the
      // VITE_ prefix filter, which is exactly what server-side keys need.
      Object.assign(process.env, env)

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const path = req.url?.split('?')[0]
        if (!path?.startsWith('/api/')) return next()

        try {
          const mod = await server.ssrLoadModule(`/api/${path.slice(5)}.ts`)
          const handler = mod.default as (r: Request) => Promise<Response>

          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)

          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          })

          const response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))

          if (response.body) {
            const reader = response.body.getReader()
            for (;;) {
              const { done, value } = await reader.read()
              if (done) break
              res.write(value)
            }
          }
          res.end()
        } catch (err) {
          // Surface the real reason in the terminal — a silent 500 here is how
          // "the assistant is unavailable" becomes impossible to debug.
          server.config.logger.error(`[api] ${path} failed:\n${String(err)}`)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Local API route failed. See terminal.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), apiRoutes(loadEnv(mode, process.cwd(), ''))],
}))
