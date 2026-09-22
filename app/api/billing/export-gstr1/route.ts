import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-auth'
import { hit } from '@/lib/rate-limit'
import { getStoredInvoices } from '@/lib/billing'
import { logAuditEvent } from '@/lib/audit'

function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) return '""'
  let str = String(value).trim()
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'` + str
  }
  return `"${str.replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await getServerSession(req)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: error || 'Unauthorized: Authentication required.' },
        { status: 401 }
      )
    }

    const user = session.user
    const roleSlug = user.role.slug.toLowerCase()
    const userCaps = user.role.capabilities || []
    const isOwner = roleSlug === 'owner_admin' || roleSlug === 'owner'
    const canExport = isOwner || userCaps.includes('billing.export')

    if (!canExport) {
      return NextResponse.json(
        {
          error: `Forbidden: Role '${user.role.name}' does not hold 'billing.export' permission.`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'

    // Rate limit check: Max 3 GSTR-1 exports per hour per user (§5.4)
    const rateLimit = await hit(`export:${user.id}`, 3, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded: Maximum 3 GSTR-1 exports per hour.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSec) },
        }
      )
    }

    const invoices = getStoredInvoices()

    // Write mandatory audit log with actor, role, IP, row count (§5.4)
    logAuditEvent({
      actor: { id: user.id, name: user.name, email: user.email || undefined, role: user.role.name },
      action: 'EXPORT',
      entity: 'GSTR1',
      entityId: `exp_gstr1_${Date.now()}`,
      branchId: user.branchId || 'pow',
      ipAddress: clientIp,
      description: `${user.name} (${user.role.name}) exported official GSTR-1 return data (${invoices.length} invoices) from ${clientIp}.`,
      afterState: { rowCount: invoices.length, ip: clientIp, role: user.role.name },
    })

    // GSTR-1 B2C / B2B Export Format
    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Customer Name',
      'Customer GSTIN',
      'Place Of Supply',
      'SAC Code',
      'Applicable % of Tax Rate',
      'Invoice Value (INR)',
      'Taxable Value (INR)',
      'CGST Amount (INR)',
      'SGST Amount (INR)',
      'Status',
    ]

    const rows = invoices.map((inv) => {
      const totalRupees = (inv.grandTotalMinor / 100).toFixed(2)
      const taxableRupees = (inv.taxableMinor / 100).toFixed(2)
      const cgstRupees = (inv.cgstMinor / 100).toFixed(2)
      const sgstRupees = (inv.sgstMinor / 100).toFixed(2)

      return [
        sanitizeCsvField(inv.invoiceNumber),
        sanitizeCsvField(inv.issueDate),
        sanitizeCsvField(inv.memberName || 'Cash Customer'),
        sanitizeCsvField('URP'), // Unregistered Person
        sanitizeCsvField('27-Maharashtra'),
        sanitizeCsvField('999723'),
        sanitizeCsvField('5.0%'),
        sanitizeCsvField(totalRupees),
        sanitizeCsvField(taxableRupees),
        sanitizeCsvField(cgstRupees),
        sanitizeCsvField(sgstRupees),
        sanitizeCsvField(inv.status.toUpperCase()),
      ]
    })

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="DNA360_GSTR1_Export_${new Date().toISOString().slice(0, 7)}.csv"`,
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'GSTR-1 export failed' }, { status: 500 })
  }
}
