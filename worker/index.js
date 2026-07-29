// Password Vault Sync Worker
// Deploy to Cloudflare Workers with a D1 database binding named DB
// Environment variable ALLOWED_ORIGIN restricts CORS (defaults to '*' for dev)

function getCorsHeaders(request, env) {
  const allowedOrigin = (env.ALLOWED_ORIGIN || '*').trim()
  const requestOrigin = request.headers.get('Origin') || ''

  // Wildcard — allow everything
  if (allowedOrigin === '*') {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  }

  // Check if request origin is in the comma-separated allow list
  const allowed = allowedOrigin.split(',').map(o => o.trim())
  if (allowed.includes(requestOrigin)) {
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    }
  }

  // Origin not allowed — but still return CORS headers to avoid opaque errors
  // Just don't include Access-Control-Allow-Origin so browser blocks it cleanly
  return null
}

function respond(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    key, 256
  )
  let out = ''
  for (const b of new Uint8Array(bits)) out += String.fromCharCode(b)
  return btoa(out)
}

function makeToken() {
  let out = ''
  for (const b of crypto.getRandomValues(new Uint8Array(32))) out += String.fromCharCode(b)
  return btoa(out)
}

async function getUserId(db, authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const now = new Date().toISOString()
  const row = await db.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?').bind(token, now).first()
  return row?.user_id ?? null
}

// Simple in-memory rate limiter (per-isolate, resets on cold start)
// For production, use Cloudflare Rate Limiting rules or Durable Objects
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 10  // max attempts per IP per window

function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 })
    return false
  }
  entry.count += 1
  if (entry.count > RATE_LIMIT_MAX_ATTEMPTS) return true
  return false
}

// Session configuration
const SESSION_DURATION_DAYS = 30 // Reduced from 90 to 30 days

export default {
  async fetch(request, env) {
    const cors = getCorsHeaders(request, env)

    // Block requests from disallowed origins
    if (cors === null) {
      return new Response('Forbidden', { status: 403 })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const { pathname } = new URL(request.url)
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown'

    // POST /api/register
    if (pathname === '/api/register' && request.method === 'POST') {
      if (isRateLimited(clientIp)) {
        return respond({ error: 'Too many requests. Try again later.' }, 429, cors)
      }

      let body
      try { body = await request.json() }
      catch { return respond({ error: 'Invalid JSON' }, 400, cors) }

      const { username, password } = body
      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return respond({ error: 'Username and password are required' }, 400, cors)
      }
      if (username.length < 3 || username.length > 64) {
        return respond({ error: 'Username must be 3-64 characters' }, 400, cors)
      }
      if (password.length < 8 || password.length > 128) {
        return respond({ error: 'Password must be 8-128 characters' }, 400, cors)
      }
      // Sanitize username: only allow alphanumeric, dash, underscore
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return respond({ error: 'Username can only contain letters, numbers, dashes, and underscores' }, 400, cors)
      }

      const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
      if (exists) return respond({ error: 'Username already taken' }, 409, cors)

      const salt = crypto.randomUUID()
      const hash = await hashPassword(password, salt + username)
      const userId = crypto.randomUUID()
      await env.DB.prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)')
        .bind(userId, username, `${salt}:${hash}`, new Date().toISOString()).run()

      const token = makeToken()
      const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, userId, expiresAt).run()
      return respond({ token }, 201, cors)
    }

    // POST /api/login
    if (pathname === '/api/login' && request.method === 'POST') {
      if (isRateLimited(clientIp)) {
        return respond({ error: 'Too many requests. Try again later.' }, 429, cors)
      }

      let body
      try { body = await request.json() }
      catch { return respond({ error: 'Invalid JSON' }, 400, cors) }

      const { username, password } = body
      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return respond({ error: 'Invalid credentials' }, 401, cors)
      }

      const user = await env.DB.prepare('SELECT id, password_hash FROM users WHERE username = ?').bind(username).first()
      if (!user) return respond({ error: 'Invalid credentials' }, 401, cors)

      const [salt] = user.password_hash.split(':')
      const hash = await hashPassword(password, salt + username)
      if (user.password_hash !== `${salt}:${hash}`) return respond({ error: 'Invalid credentials' }, 401, cors)

      // Clean up expired sessions for this user (housekeeping)
      const now = new Date().toISOString()
      await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?').bind(user.id, now).run()

      const token = makeToken()
      const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, user.id, expiresAt).run()
      return respond({ token }, 200, cors)
    }

    // POST /api/logout
    if (pathname === '/api/logout' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
      }
      return respond({ ok: true }, 200, cors)
    }

    // GET /api/vault
    if (pathname === '/api/vault' && request.method === 'GET') {
      const userId = await getUserId(env.DB, request.headers.get('Authorization'))
      if (!userId) return respond({ error: 'Unauthorized' }, 401, cors)
      const vault = await env.DB.prepare('SELECT encrypted_blob, updated_at FROM vaults WHERE user_id = ?').bind(userId).first()
      return respond(vault ? { blob: vault.encrypted_blob, updatedAt: vault.updated_at } : { blob: null }, 200, cors)
    }

    // PUT /api/vault
    if (pathname === '/api/vault' && request.method === 'PUT') {
      const userId = await getUserId(env.DB, request.headers.get('Authorization'))
      if (!userId) return respond({ error: 'Unauthorized' }, 401, cors)

      let body
      try { body = await request.json() }
      catch { return respond({ error: 'Invalid JSON' }, 400, cors) }

      const { blob } = body
      if (!blob || typeof blob !== 'string') return respond({ error: 'Missing or invalid blob' }, 400, cors)

      // Enforce a reasonable size limit (5MB encrypted vault)
      if (blob.length > 5 * 1024 * 1024) {
        return respond({ error: 'Vault blob exceeds maximum size (5MB)' }, 413, cors)
      }

      const now = new Date().toISOString()
      await env.DB.prepare('INSERT OR REPLACE INTO vaults (user_id, encrypted_blob, updated_at) VALUES (?, ?, ?)').bind(userId, blob, now).run()
      return respond({ ok: true }, 200, cors)
    }

    return respond({ error: 'Not found' }, 404, cors)
  },
}
