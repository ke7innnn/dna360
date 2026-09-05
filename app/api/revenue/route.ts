import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-auth'
import { getStoredInvoices } from '@/lib/billing'
import { getStoredMembers } from '@/lib/members'

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
    const isOwner = roleSlug === 'owner_admin' || roleSlug === 'owner'

    if (!isOwner) {
      return NextResponse.json(
        {
          error: `Forbidden: Role '${user.role.name}' is not authorized to view financial revenue data.`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const invoices = getStoredInvoices()
    const members = getStoredMembers()

    // 1. Upfront Collections MTD (total cash collected)
    const collectionsMinor = invoices.reduce((sum, inv) => sum + inv.paidAmountMinor, 0)

    // 2. GST Calculation: Back-calculation at 5% SAC 999723 (Inclusive Amount × 5 / 105)
    const gstLiabilityMinor = Math.round((collectionsMinor * 5) / 105)
    const taxableRevenueMinor = collectionsMinor - gstLiabilityMinor
    const cgstMinor = Math.round(gstLiabilityMinor / 2)
    const sgstMinor = gstLiabilityMinor - cgstMinor

    // 3. Recognised vs Deferred Revenue:
    // Annual memberships are deferred across 12 months; 1 month recognised in current period
    const recognisedRevenueMinor = Math.round(collectionsMinor / 12)
    const deferredRevenueMinor = collectionsMinor - recognisedRevenueMinor

    return NextResponse.json({
      currency: 'INR',
      period: new Date().toISOString().slice(0, 7),
      collectionsMinor,
      recognisedRevenueMinor,
      deferredRevenueMinor,
      gst: {
        totalGstMinor: gstLiabilityMinor,
        cgstMinor,
        sgstMinor,
        taxableMinor: taxableRevenueMinor,
        sacCode: '999723',
        ratePct: 5.0,
      },
      memberCount: members.length,
      invoiceCount: invoices.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Revenue calculation failed' }, { status: 500 })
  }
}
