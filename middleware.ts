import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

const SESSION_SECRET = process.env.SESSION_SECRET || 'dna360_secure_session_secret_key_powai_2026'

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

/**
 * Validates HMAC token signature with Web Crypto API directly in Edge Middleware
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
  const token = req.cookies.get('dna360_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '')
  const hasValidSession = await isTokenValid(token)

  // 3. Unauthenticated access handling for private routes
  if (!isPublic && !hasValidSession) {
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
  if (hasValidSession) {
    const payload = parseTokenPayload(token)
    if (payload?.must_change_password === true) {
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

    // 5. Role-Based Route Barrier (Prevent Member Privilege Escalation)
    const roleSlug = (payload?.role || '').toLowerCase()
    const isMember = roleSlug === 'member' || payload?.type === 'MEMBER'

    if (isMember) {
      // Members cannot access staff management and operations routes
      const isStaffRoute = STAFF_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
      if (isStaffRoute) {
        const memberHome = new URL('/dashboard', req.url)
        const redirectResponse = NextResponse.redirect(memberHome, 307)
        addSecurityHeaders(redirectResponse)
        return redirectResponse
      }
    }

    // 6. Authenticated user visiting /login -> redirect to their role's dashboard
    if (pathname === '/login') {
      let targetPath = isMember ? '/dashboard' : getStaffRedirect(payload?.role)
      if (payload?.must_change_password) {
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
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https:",
      "media-src 'self' data: https: blob:",
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
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
