// POST /api/booking — server-side proxy to the n8n booking webhook.
//
// The browser never sees the webhook URL or its auth token. That matters more
// here than for the assistant: this payload carries a patient's name, phone,
// email, and what they want to be seen for.
//
// Until N8N_BOOKING_WEBHOOK_URL is set this serves deterministic mock
// responses so the whole UI can be built and tested before the workflow
// exists. The mock is fenced below and switches itself off the moment the real
// URL is configured — there is no flag to remember to flip.

export const config = { runtime: 'edge' }

const WEBHOOK_TIMEOUT_MS = 15_000
const SLOT_MINUTES = 30

// ---------------------------------------------------------------------------
// The contract. Both halves of the system agree on exactly this.
// ---------------------------------------------------------------------------

export interface BookingRequest {
  requestId: string
  patient: { name: string; phone: string; email: string }
  service: string
  preferred: { start: string; durationMinutes: number } // start is ISO-8601 with offset
  notes?: string
  locale: 'en' | 'bn'
}

export interface Slot {
  start: string
  end: string
}

export interface BookingResponse {
  status: 'confirmed' | 'unavailable' | 'error'
  details: {
    appointmentId?: string
    doctor?: string
    service?: string
    start?: string
    end?: string
    location?: string
    calendarEventId?: string
    notifications?: { email?: 'sent' | 'failed' | 'skipped'; sms?: 'sent' | 'failed' | 'skipped' }
  }
  alternate_slots: Slot[]
  message?: string
}

// ---------------------------------------------------------------------------
// Validation. Server-side because the client's copy can be bypassed.
// ---------------------------------------------------------------------------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Bangladeshi mobile: 01[3-9] + 8 digits, optionally +880 / 880 prefixed.
const BD_PHONE = /^(?:\+?880|0)1[3-9]\d{8}$/

export function validate(input: unknown): { ok: true; value: BookingRequest } | { ok: false; field: string; message: string } {
  if (!input || typeof input !== 'object') return { ok: false, field: 'body', message: 'Malformed request.' }
  const b = input as Record<string, unknown>
  const patient = (b.patient ?? {}) as Record<string, unknown>
  const preferred = (b.preferred ?? {}) as Record<string, unknown>

  const name = typeof patient.name === 'string' ? patient.name.trim() : ''
  if (name.length < 2 || name.length > 100) {
    return { ok: false, field: 'name', message: 'Enter the patient’s full name.' }
  }

  const phone = typeof patient.phone === 'string' ? patient.phone.replace(/[\s-]/g, '') : ''
  if (!BD_PHONE.test(phone)) {
    return { ok: false, field: 'phone', message: 'Enter a valid mobile number, e.g. 01712 345678.' }
  }

  const email = typeof patient.email === 'string' ? patient.email.trim() : ''
  if (!EMAIL.test(email) || email.length > 200) {
    return { ok: false, field: 'email', message: 'Enter a valid email address for the confirmation.' }
  }

  const service = typeof b.service === 'string' ? b.service.trim() : ''
  if (!service || service.length > 100) {
    return { ok: false, field: 'service', message: 'Choose what the appointment is for.' }
  }

  const start = typeof preferred.start === 'string' ? preferred.start : ''
  const when = Date.parse(start)
  if (!start || Number.isNaN(when)) {
    return { ok: false, field: 'start', message: 'Choose a date and time.' }
  }
  if (when < Date.now()) {
    return { ok: false, field: 'start', message: 'That time is in the past. Choose a later slot.' }
  }
  // A year out is not a booking, it is a typo in the year field.
  if (when > Date.now() + 365 * 24 * 3600 * 1000) {
    return { ok: false, field: 'start', message: 'Choose a date within the next year.' }
  }

  const notes = typeof b.notes === 'string' ? b.notes.trim().slice(0, 1000) : undefined

  return {
    ok: true,
    value: {
      requestId: typeof b.requestId === 'string' && b.requestId ? b.requestId.slice(0, 64) : crypto.randomUUID(),
      patient: { name, phone, email },
      service,
      preferred: { start, durationMinutes: SLOT_MINUTES },
      notes,
      locale: b.locale === 'bn' ? 'bn' : 'en',
    },
  }
}

// ---------------------------------------------------------------------------
// MOCK — active only while N8N_BOOKING_WEBHOOK_URL is unset.
// The real availability logic belongs in n8n against Google Calendar; this
// exists purely so the frontend has something honest to develop against.
// ---------------------------------------------------------------------------

const CLINIC_START_HOUR = 17 // 17:00 Asia/Dhaka
const CLINIC_END_HOUR = 21
const DHAKA_OFFSET_MS = 6 * 3600 * 1000

function dhakaHour(ms: number) {
  return new Date(ms + DHAKA_OFFSET_MS).getUTCHours()
}

function toDhakaIso(ms: number) {
  return new Date(ms + DHAKA_OFFSET_MS).toISOString().replace('Z', '+06:00')
}

function mockBooking(req: BookingRequest): BookingResponse {
  const start = Date.parse(req.preferred.start)
  const hour = dhakaHour(start)
  const durationMs = req.preferred.durationMinutes * 60_000

  // Deterministic so tests are repeatable: outside clinic hours, or any slot
  // starting on the hour of 19:00, is treated as taken.
  const taken = hour < CLINIC_START_HOUR || hour >= CLINIC_END_HOUR || hour === 19

  if (!taken) {
    return {
      status: 'confirmed',
      details: {
        appointmentId: `MOCK-${req.requestId.slice(0, 8).toUpperCase()}`,
        doctor: 'Dr. Abdul Awal Bhuiyan',
        service: req.service,
        start: toDhakaIso(start),
        end: toDhakaIso(start + durationMs),
        location: 'Labaid Cardiac Hospital, Dhaka',
        calendarEventId: 'mock-event',
        notifications: { email: 'skipped', sms: 'skipped' },
      },
      alternate_slots: [],
      message: 'MOCK RESPONSE — n8n webhook is not configured.',
    }
  }

  // Next three free slots inside clinic hours, from the requested day onward.
  const alternates: Slot[] = []
  let cursor = start
  for (let i = 0; i < 96 && alternates.length < 3; i++) {
    cursor += SLOT_MINUTES * 60_000
    const h = dhakaHour(cursor)
    if (h >= CLINIC_START_HOUR && h < CLINIC_END_HOUR && h !== 19) {
      alternates.push({ start: toDhakaIso(cursor), end: toDhakaIso(cursor + durationMs) })
    }
  }

  return {
    status: 'unavailable',
    details: { doctor: 'Dr. Abdul Awal Bhuiyan', service: req.service },
    alternate_slots: alternates,
    message: 'MOCK RESPONSE — n8n webhook is not configured.',
  }
}

// ---------------------------------------------------------------------------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

function errorResponse(message: string, status: number, field?: string) {
  const body: BookingResponse & { field?: string } = {
    status: 'error',
    details: {},
    alternate_slots: [],
    message,
  }
  if (field) body.field = field
  return json(body, status)
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  let parsed: unknown
  try {
    parsed = await req.json()
  } catch {
    return errorResponse('Malformed request.', 400)
  }

  const check = validate(parsed)
  if (!check.ok) return errorResponse(check.message, 422, check.field)

  const webhookUrl = process.env.N8N_BOOKING_WEBHOOK_URL
  if (!webhookUrl) return json(mockBooking(check.value))

  const headers: Record<string, string> = { 'content-type': 'application/json' }
  // Set this before switching the n8n webhook from test to production.
  const token = process.env.N8N_BOOKING_TOKEN
  if (token) headers.authorization = `Bearer ${token}`

  let upstream: Response
  try {
    upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(check.value),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    })
  } catch (err) {
    const timedOut = (err as Error)?.name === 'TimeoutError'
    console.error('n8n booking webhook failed:', String(err))
    return errorResponse(
      timedOut
        ? 'The booking system did not respond in time. Your appointment was not booked — please call the number below.'
        : 'Could not reach the booking system. Your appointment was not booked — please call the number below.',
      504,
    )
  }

  const raw = await upstream.text()
  if (!upstream.ok) {
    console.error('n8n booking webhook responded', upstream.status, raw)
    return errorResponse('The booking system returned an error. Your appointment was not booked.', 502)
  }

  // n8n is easy to misconfigure into returning HTML or an empty body. Failing
  // loudly here beats the UI rendering "undefined" as a confirmation.
  try {
    const data = JSON.parse(raw) as BookingResponse
    if (data.status !== 'confirmed' && data.status !== 'unavailable' && data.status !== 'error') {
      throw new Error('unrecognised status')
    }
    return json({ ...data, alternate_slots: data.alternate_slots ?? [], details: data.details ?? {} })
  } catch {
    console.error('n8n booking webhook returned unparseable body:', raw.slice(0, 500))
    return errorResponse('The booking system sent an unreadable response. Your appointment was not confirmed.', 502)
  }
}
