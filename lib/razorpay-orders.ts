import { prisma } from '@/lib/prisma'

export interface RazorpayOrderMapping {
  orderId: string
  invoiceId: string
  expectedAmountMinor: number
  memberId: string
  createdAt: string
  verifiedAt?: string
  paymentId?: string
  /** Catalog plan chosen server-side (self-service plan purchases only) */
  planId?: string
  planTitle?: string
}

const g = globalThis as unknown as {
  __dna360_razorpay_orders?: Map<string, RazorpayOrderMapping>
}
if (!g.__dna360_razorpay_orders) {
  g.__dna360_razorpay_orders = new Map<string, RazorpayOrderMapping>()
}
const orderMappings = g.__dna360_razorpay_orders

export function saveOrderMapping(orderId: string, mapping: RazorpayOrderMapping): void {
  orderMappings.set(orderId, mapping)

  // Persist asynchronously to Supabase
  prisma.razorpayOrderRecord.upsert({
    where: { orderId },
    create: {
      orderId,
      invoiceId: mapping.invoiceId,
      memberId: mapping.memberId,
      expectedAmountMinor: BigInt(mapping.expectedAmountMinor),
      status: 'created',
      paymentId: mapping.paymentId || null,
      planId: mapping.planId || null,
      planTitle: mapping.planTitle || null,
    },
    update: {
      paymentId: mapping.paymentId || null,
      planId: mapping.planId || null,
      planTitle: mapping.planTitle || null,
    },
  }).catch(err => {
    console.error('Failed to persist RazorpayOrderRecord to Supabase:', err)
  })
}

export function getOrderMapping(orderId: string): RazorpayOrderMapping | null {
  return orderMappings.get(orderId) || null
}

export async function getOrderMappingAsync(orderId: string): Promise<RazorpayOrderMapping | null> {
  const inMemory = orderMappings.get(orderId)
  if (inMemory) return inMemory

  try {
    const dbRecord = await prisma.razorpayOrderRecord.findUnique({
      where: { orderId },
    })
    if (dbRecord) {
      const mapping: RazorpayOrderMapping = {
        orderId: dbRecord.orderId,
        invoiceId: dbRecord.invoiceId,
        expectedAmountMinor: Number(dbRecord.expectedAmountMinor),
        memberId: dbRecord.memberId,
        createdAt: dbRecord.createdAt.toISOString(),
        verifiedAt: dbRecord.verifiedAt?.toISOString(),
        paymentId: dbRecord.paymentId || undefined,
        planId: dbRecord.planId || undefined,
        planTitle: dbRecord.planTitle || undefined,
      }
      orderMappings.set(orderId, mapping)
      return mapping
    }
  } catch (err) {
    console.error('Failed to query RazorpayOrderRecord from Supabase:', err)
  }
  return null
}

export function markOrderVerified(orderId: string, paymentId: string): void {
  const mapping = orderMappings.get(orderId)
  const now = new Date()
  if (mapping) {
    mapping.verifiedAt = now.toISOString()
    mapping.paymentId = paymentId
  }

  prisma.razorpayOrderRecord.update({
    where: { orderId },
    data: {
      status: 'paid',
      paymentId,
      verifiedAt: now,
    },
  }).catch(err => {
    console.error('Failed to update RazorpayOrderRecord in Supabase:', err)
  })
}

export function clearOrderMappings(): void {
  orderMappings.clear()
}
