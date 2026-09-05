import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, checkExportRateLimit } from '@/lib/server-auth'
import { getStoredInvoices } from '@/lib/billing'
import { logAuditEvent } from '@/lib/audit'

export async function GET(req: NextRequest) {
  try {
    const { session, error } = getServerSession(req)
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

    // Rate limit check
    const rateLimit = checkExportRateLimit(user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded: Maximum 3 GSTR-1 exports per hour.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    const invoices = getStoredInvoices()

    logAuditEvent({
      actor: { id: user.id, name: user.name, email: user.email || user.phone, role: user.role.name },
      action: 'EXPORT',
      entity: 'GSTR1',
      entityId: `exp_gstr1_${Date.now()}`,
      branchId: user.branchId,
      description: `${user.name} (${user.role.name}) exported official GSTR-1 return data (${invoices.length} invoices).`,
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
        inv.invoiceNumber,
        inv.issueDate,
        `"${(inv.memberName || 'Cash Customer').replace(/"/g, '""')}"`,
        'URP', // Unregistered Person
        '27-Maharashtra',
        '999723',
        '5.0%',
        totalRupees,
        taxableRupees,
        cgstRupees,
        sgstRupees,
        inv.status.toUpperCase(),
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
