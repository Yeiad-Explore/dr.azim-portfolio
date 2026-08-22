// POST /api/chat — the only thing standing between the public internet and
// the Azure key. The key is read from the environment here and never leaves
// this process; the browser talks to this route and nothing else.
//
// Azure's SSE frames are unwrapped server-side and the response streams back
// as plain UTF-8 text, so the client needs no event-stream parser.

import { SYSTEM_PROMPT, filteredReply } from './_prompt.ts'

export const config = { runtime: 'edge' }

const MAX_MESSAGES = 12 // trailing turns kept; older context is dropped
const MAX_CHARS = 2000 // per message
const MAX_OUTPUT_TOKENS = 700

// Requests per window, per IP. In-memory, so it resets on cold start and is
// per-instance — it blunts casual abuse, it is NOT a real quota. Put Vercel's
// firewall or a shared store in front of this before taking real traffic.
const RATE_LIMIT = 20
const WINDOW_MS = 60_000
const hits = new Map<string, { n: number; reset: number }>()

function rateLimited(ip: string) {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now > entry.reset) {
    hits.set(ip, { n: 1, reset: now + WINDOW_MS })
    return false
  }
  entry.n += 1
  return entry.n > RATE_LIMIT
}

interface Turn {
  role: 'user' | 'assistant'
  content: string
}

function parseTurns(input: unknown): Turn[] | null {
  if (!Array.isArray(input) || input.length === 0) return null

  const turns: Turn[] = []
  for (const raw of input.slice(-MAX_MESSAGES)) {
    if (!raw || typeof raw !== 'object') return null
    const { role, content } = raw as Record<string, unknown>
    // Only user and assistant cross the boundary. A client-supplied "system"
    // turn would sit alongside the real instructions and could rewrite them.
    if (role !== 'user' && role !== 'assistant') return null
    if (typeof content !== 'string') return null
    const text = content.trim()
    if (!text) continue
    turns.push({ role, content: text.slice(0, MAX_CHARS) })
  }

  if (turns.length === 0) return null
  if (turns[turns.length - 1].role !== 'user') return null
  return turns
}

function fail(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return fail(405, 'Method not allowed')

  const key = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const version = process.env.AZURE_OPENAI_API_VERSION
  const deployment = process.env.CHAT_MODEL_DEPLOYMENT

  if (!key || !endpoint || !version || !deployment) {
    // Never echo which one is missing — that maps the deployment for anyone probing.
    console.error('azure openai env incomplete')
    return fail(500, 'Assistant is not configured.')
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (rateLimited(ip)) return fail(429, 'Too many messages. Wait a moment.')

  let turns: Turn[] | null
  try {
    const body = (await req.json()) as { messages?: unknown }
    turns = parseTurns(body.messages)
  } catch {
    return fail(400, 'Malformed request.')
  }
  if (!turns) return fail(400, 'Malformed request.')

  const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${version}`

  let upstream: Response
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...turns],
        // Low, deliberately. This answers safety-critical questions; the
        // wording of "call 999 now" should not vary run to run.
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
      }),
    })
  } catch {
    return fail(502, 'Could not reach the assistant.')
  }

  if (!upstream.ok || !upstream.body) {
    const raw = await upstream.text().catch(() => '')

    // Azure's filter rejects some prompts before the model runs. Self-harm is
    // the one that must never come back as an error page, so these are served
    // as normal assistant turns rather than failures.
    const canned = filteredReply(upstream.status, raw)
    if (canned) {
      return new Response(canned, {
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      })
    }

    console.error('azure openai responded', upstream.status, raw)
    return fail(502, 'The assistant is unavailable right now.')
  }

  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  const text = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true })
        // SSE frames are newline-delimited; the last piece may be a partial
        // line, so it stays in the buffer until its newline arrives.
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta) controller.enqueue(encoder.encode(delta))
          } catch {
            // A frame we can't parse is not worth killing the stream over.
          }
        }
      },
    }),
  )

  return new Response(text, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}
