export interface RazorpayOrderMapping {
  orderId: string
  invoiceId: string
  expectedAmountMinor: number
  memberId: string
  createdAt: string
  verifiedAt?: string
  paymentId?: string
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
}

export function getOrderMapping(orderId: string): RazorpayOrderMapping | null {
  return orderMappings.get(orderId) || null
}

export function markOrderVerified(orderId: string, paymentId: string): void {
  const mapping = orderMappings.get(orderId)
  if (mapping) {
    mapping.verifiedAt = new Date().toISOString()
    mapping.paymentId = paymentId
  }
}

export function clearOrderMappings(): void {
  orderMappings.clear()
}
