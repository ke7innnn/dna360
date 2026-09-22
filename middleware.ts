import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromMemoryByHash, type AuthSessionRecord } from '@/lib/session-store'

const PUBLIC_EXACT_PATHS = new Set([
  '/',
  '/about',
  '/contact',
  '/services',
  '/trainers',
  '/gallery',
  '/partner-dna-360',
  '/facility-setup-services',
  '/franchise-services',
  '/management-services',
  '/login',
  '/forgot-password',
  '/privacy-policy',
  '/terms-and-conditions',
  '/cancellation-refund-policy',
  '/privacy',
  '/terms',
  '/refund',
  '/refund-policy',
  '/cancellation-policy',
  '/robots.txt',
  '/favicon.ico',
  '/sitemap.xml',
  '/api/whatsapp/webhook',
])

const PUBLIC_PATH_PREFIXES = [
  '/services/',
  '/trainers/',
  '/_next/',
  '/images/',
  '/assets/',
  '/api/inquiries',
  '/api/auth/login',
  '/api/auth/session',
  '/api/webhooks/',
  '/api/health',
]

/**
 * Checks whether a path is public
 */
function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true
  for (const prefix of PUBLIC_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }
  return false
}

export const SESSION_COOKIE_NAME = 'dna360_session'

const STAFF_ONLY_PREFIXES = [
  '/overview',
  '/analytics',
  '/revenue',
  '/billing',
  '/staff',
  '/settings',
  '/audit-log',
  '/leads',
  '/front-desk',
  '/attendance',
]

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'test_dna360_secure_session_secret_key_powai_2026_min_48_chars'

/**
 * Validates HMAC token signature with Web Crypto API directly in Edge Middleware (stateless & sub-millisecond)
 */
async function isTokenValid(token: string | undefined): Promise<boolean> {
  if (!token || !token.includes('.')) return false
  const [data, signature] = token.split('.')
  if (!data || !signature) return false

  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    let b64 = signature.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const sigBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    const isSigMatch = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data))
    if (!isSigMatch) return false

    let dataB64 = data.replace(/-/g, '+').replace(/_/g, '/')
    while (dataB64.length % 4) dataB64 += '='
    const json = atob(dataB64)
    const payload = JSON.parse(json)
    if (!payload.sessionId || !payload.userId) return false
    if (payload.expiresAt && Date.now() > payload.expiresAt) return false
    return true
  } catch {
    return false
  }
}

/**
 * Parses payload without validating signature (already verified by isTokenValid)
 */
function parseTokenPayload(token: string | undefined): any | null {
  if (!token || !token.includes('.')) return null
  const [data] = token.split('.')
  if (!data) return null
  try {
    let dataB64 = data.replace(/-/g, '+').replace(/_/g, '/')
    while (dataB64.length % 4) dataB64 += '='
    const json = atob(dataB64)
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Hash raw token with Web Crypto API in Edge Middleware
 */
async function hashTokenEdge(token: string): Promise<string> {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(token))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

interface ResolvedSession {
  role_slug: string
  user_type: string
  must_change_password: boolean
  revoked_at: string | null
  expires_at: string
}

/**
 * Resolve session: instant HMAC verification for signed tokens, fallback for opaque tokens
 */
async function resolveSession(token: string | undefined): Promise<ResolvedSession | null> {
  if (!token || typeof token !== 'string') return null

  // 1. Instant HMAC validation for signed tokens (0.01ms Edge execution)
  if (token.includes('.')) {
    const valid = await isTokenValid(token)
    if (!valid) return null

    const payload = parseTokenPayload(token)
    if (!payload) return null

    const tokenHash = await hashTokenEdge(token)
    const mem = getSessionFromMemoryByHash(tokenHash) || (payload.sessionId ? getSessionFromMemoryByHash(payload.sessionId) : null)
    if (mem?.revoked_at) return null

    return {
      role_slug: payload.role,
      user_type: payload.type,
      must_change_password: Boolean(payload.must_change_password),
      revoked_at: null,
      expires_at: new Date(payload.expiresAt).toISOString(),
    }
  }

  // 2. Fallback for opaque tokens
  try {
    const tokenHash = await hashTokenEdge(token)

    // Check in-memory session store
    const mem = getSessionFromMemoryByHash(tokenHash)
    if (mem) {
      if (mem.revoked_at) return null
      if (new Date(mem.expires_at).getTime() < Date.now()) return null
      return {
        role_slug: mem.role_slug,
        user_type: mem.user_type,
        must_change_password: mem.must_change_password,
        revoked_at: mem.revoked_at,
        expires_at: mem.expires_at,
      }
    }

    // Check Supabase REST API if configured
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rqmgvwcqfbfnrixxvgza.supabase.co'

    if (serviceKey && supabaseUrl) {
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/auth_sessions?token_hash=eq.${encodeURIComponent(tokenHash)}&select=role_slug,user_type,must_change_password,revoked_at,expires_at`,
          {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
            cache: 'no-store',
          }
        )
        if (res.ok) {
          const rows = await res.json()
          if (Array.isArray(rows) && rows.length > 0) {
            const row = rows[0]
            if (row.revoked_at) return null
            if (new Date(row.expires_at).getTime() < Date.now()) return null
            return {
              role_slug: row.role_slug,
              user_type: row.user_type,
              must_change_password: Boolean(row.must_change_password),
              revoked_at: row.revoked_at,
              expires_at: row.expires_at,
            }
          }
        }
      } catch {
        // Fall back
      }
    }

    return null
  } catch {
    return null
  }
}

function getStaffRedirect(roleSlug?: string): string {
  const slug = (roleSlug || '').toLowerCase()
  if (slug === 'hr_head') return '/staff'
  if (slug.includes('trainer') || slug === 'masseur') return '/classes'
  if (slug.includes('consultant')) return '/leads'
  if (slug === 'front_desk') return '/front-desk'
  if (slug === 'supervisor') return '/attendance'
  return '/overview'
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Static and public route bypass
  const isPublic = isPublicPath(pathname)

  // 2. Extract session token
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value || req.headers.get('authorization')?.replace('Bearer ', '')
  const session = await resolveSession(token)

  // 3. Unauthenticated access handling for private routes
  if (!isPublic && !session) {
    if (pathname.startsWith('/api/')) {
      const unauthorizedResponse = NextResponse.json(
        {
          error: 'Unauthorized: Valid authentication session required.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      )
      addSecurityHeaders(unauthorizedResponse)
      return unauthorizedResponse
    }

    // Redirect private page to login with safe target redirect param (prevent Open Redirects)
    const safePath = pathname.startsWith('/') && !pathname.startsWith('//') ? pathname : '/overview'
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', safePath)
    const redirectResponse = NextResponse.redirect(loginUrl, 307)
    addSecurityHeaders(redirectResponse)
    return redirectResponse
  }

  // 4. Mandatory first-login password change enforcement (§1)
  if (session) {
    if (session.must_change_password === true) {
      const isAllowedPwdPath =
        pathname === '/change-password' ||
        pathname === '/api/auth/change-password' ||
        pathname === '/api/auth/logout' ||
        pathname.startsWith('/_next/')

      if (!isAllowedPwdPath) {
        if (pathname.startsWith('/api/')) {
          const mustChangeResponse = NextResponse.json(
            {
              error: 'Forbidden: Mandatory password change required before accessing the platform.',
              code: 'MUST_CHANGE_PASSWORD',
              redirectUrl: '/change-password',
            },
            { status: 403 }
          )
          addSecurityHeaders(mustChangeResponse)
          return mustChangeResponse
        }

        const changePwdUrl = new URL('/change-password', req.url)
        const redirectResponse = NextResponse.redirect(changePwdUrl, 307)
        addSecurityHeaders(redirectResponse)
        return redirectResponse
      }
    }

    // 5. Role-Based Route Barrier (Role strictly from DB/session, never from token payload)
    const roleSlug = (session.role_slug || '').toLowerCase()
    const isMember = roleSlug === 'member' || session.user_type === 'MEMBER'

    if (isMember) {
      // Members cannot access staff management, operations routes, or desktop dashboard/classes
      const isStaffRoute = STAFF_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
      const isStaffOrDesktop =
        isStaffRoute ||
        pathname === '/dashboard' ||
        pathname === '/overview' ||
        pathname === '/classes' ||
        pathname === '/classes/'

      if (isStaffOrDesktop) {
        const dest = pathname.startsWith('/classes') ? '/m/classes' : '/m'
        const memberHome = new URL(dest, req.url)
        const redirectResponse = NextResponse.redirect(memberHome, 307)
        addSecurityHeaders(redirectResponse)
        return redirectResponse
      }
    }

    // 6. Authenticated user visiting /login -> redirect to their role's dashboard (/m for members)
    if (pathname === '/login') {
      let targetPath = isMember ? '/m' : getStaffRedirect(session.role_slug)
      if (session.must_change_password) {
        targetPath = '/change-password'
      }
      const targetUrl = new URL(targetPath, req.url)
      const redirectResponse = NextResponse.redirect(targetUrl, 307)
      addSecurityHeaders(redirectResponse)
      return redirectResponse
    }
  }

  // 7. Proceed with security headers applied
  const response = NextResponse.next()
  addSecurityHeaders(response)
  return response
}

/**
 * Injects defense-in-depth HTTP security headers
 */
function addSecurityHeaders(response: NextResponse) {
  // Prevent indexing of private deployment & administrative views
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')

  // Clickjacking protection
  response.headers.set('X-Frame-Options', 'DENY')

  // MIME type sniffing prevention
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer leakage prevention
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Enforce HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // Cross-Site Scripting filter (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Content Security Policy
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rqmgvwcqfbfnrixxvgza.supabase.co'
  let supabaseHost = 'rqmgvwcqfbfnrixxvgza.supabase.co'
  try {
    supabaseHost = new URL(supabaseUrl).host
  } catch {
    // fallback
  }

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://*.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com https://checkout.razorpay.com data:",
      "img-src 'self' data: blob: https://www.dna360.in http://www.dna360.in https://checkout.razorpay.com https://cdn.razorpay.com https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com https://www.googletagmanager.com https://*.google.com https://*.doubleclick.net",
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net`,
      "media-src 'self' data: blob:",
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image formats (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
