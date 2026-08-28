'use client'

import React, { useState } from 'react'
import {
  ShoppingBag, Plus, Minus, Trash2, CheckCircle,
  CreditCard, Sparkles, Receipt, QrCode, DollarSign,
} from 'lucide-react'
import { Modal } from '@/components/app/ui/modal'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { getStoredPosProducts, createPosSale } from '@/lib/frontdesk'
import { getStoredMembers } from '@/lib/members'
import { formatINR } from '@/lib/utils'
import type { PosProduct, PosSaleItem, PosSale } from '@/types/frontdesk'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function PosRetailModal({
  open,
  onOpenChange,
  onSaleCompleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaleCompleted?: (sale: PosSale) => void
}) {
  const products = getStoredPosProducts()
  const members = getStoredMembers()

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [cart, setCart] = useState<{ product: PosProduct; quantity: number }[]>([])
  const [customerType, setCustomerType] = useState<'member' | 'guest'>('member')
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '')
  const [guestName, setGuestName] = useState('Walk-In Guest')
  const [paymentMode, setPaymentMode] = useState<PosSale['paymentMode']>('UPI')
  const [loading, setLoading] = useState(false)

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category === activeCategory)

  const selectedMember = members.find((m) => m.id === selectedMemberId)

  const handleAddToCart = (product: PosProduct) => {
    const existingIndex = cart.findIndex((i) => i.product.id === product.id)
    if (existingIndex !== -1) {
      const updated = [...cart]
      updated[existingIndex].quantity += 1
      setCart(updated)
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : null
        }
        return item
      })
      .filter(Boolean) as { product: PosProduct; quantity: number }[]
    setCart(updated)
  }

  const subtotalMinor = cart.reduce((acc, item) => acc + item.product.priceMinor * item.quantity, 0)
  const gstMinor = Math.round(subtotalMinor * 0.18) // 18% GST standard retail
  const grandTotalMinor = subtotalMinor + gstMinor

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    setLoading(true)

    const saleItems: PosSaleItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      priceMinor: item.product.priceMinor,
      totalMinor: item.product.priceMinor * item.quantity,
    }))

    const newSale = createPosSale({
      customerType,
      customerId: customerType === 'member' && selectedMember ? selectedMember.id : undefined,
      customerName: customerType === 'member' && selectedMember ? selectedMember.name : guestName,
      customerPhone: customerType === 'member' && selectedMember ? selectedMember.phone : undefined,
      items: saleItems,
      subtotalMinor,
      gstMinor,
      totalMinor: grandTotalMinor,
      paymentMode,
      recordedBy: 'Amit Sharma (Front Desk)',
    })

    setLoading(false)
    toast.success(`POS Sale Completed: ${newSale.receiptNumber}`, {
      description: `Amount: ${formatINR(newSale.totalMinor)} via ${newSale.paymentMode}`,
    })

    setCart([])
    if (onSaleCompleted) onSaleCompleted(newSale)
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="POS Retail & Supplement Cafe"
      description="Quick checkout for protein shakes, energy drinks, snacks, and gym merchandise."
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Product Grid */}
        <div className="md:col-span-7 space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl glass-input">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'shake', label: 'Shakes' },
              { id: 'beverage', label: 'Beverages' },
              { id: 'snack', label: 'Snacks' },
              { id: 'gear', label: 'Gear & Apparel' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                  activeCategory === cat.id
                    ? 'bg-[var(--app-sidebar-active)] text-[var(--app-text-primary)] shadow-xs'
                    : 'text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleAddToCart(prod)}
                className="p-3 rounded-xl glass-card border border-[var(--app-glass-border)] hover:border-[var(--aurora-1)]/40 cursor-pointer transition-all space-y-2 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--aurora-1)]">
                    {prod.category}
                  </span>
                  <h4 className="font-semibold text-xs text-[var(--app-text-primary)] leading-snug line-clamp-2 mt-0.5">
                    {prod.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--app-glass-border)]">
                  <span className="font-mono font-bold text-xs text-[var(--app-text-primary)]">
                    {formatINR(prod.priceMinor)}
                  </span>
                  <span className="text-[0.6875rem] text-[var(--app-text-muted)]">
                    {prod.stockCount} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Cart & Checkout Summary */}
        <div className="md:col-span-5 p-4 rounded-2xl glass-input space-y-4 flex flex-col justify-between border border-[var(--app-glass-border)]">
          <div className="space-y-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--app-text-primary)] flex items-center justify-between">
              <span>Cart ({cart.reduce((a, c) => a + c.quantity, 0)})</span>
              {cart.length > 0 && (
                <button type="button" onClick={() => setCart([])} className="text-[0.6875rem] text-[var(--app-text-muted)] hover:text-[var(--app-danger)]">
                  Clear
                </button>
              )}
            </h4>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between text-xs py-1 border-b border-[var(--app-glass-border)]">
                    <div className="flex-1 pr-2 truncate">
                      <p className="font-medium text-[var(--app-text-primary)] truncate">{item.product.name}</p>
                      <span className="font-mono text-[0.6875rem] text-[var(--app-text-muted)]">{formatINR(item.product.priceMinor)} ea</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" onClick={() => handleUpdateQuantity(item.product.id, -1)} className="p-1 rounded bg-[var(--app-glass-bg)] hover:bg-[var(--app-glass-border)]">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                      <button type="button" onClick={() => handleUpdateQuantity(item.product.id, 1)} className="p-1 rounded bg-[var(--app-glass-bg)] hover:bg-[var(--app-glass-border)]">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--app-text-muted)] text-center py-6">
                  Cart is empty. Tap items to add.
                </p>
              )}
            </div>

            {/* Customer Allocation */}
            <div className="space-y-2 pt-2 border-t border-[var(--app-glass-border)] text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--app-text-muted)]">Customer:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerType('member')}
                    className={cn('font-semibold', customerType === 'member' ? 'text-[var(--aurora-1)]' : 'text-[var(--app-text-muted)]')}
                  >
                    Member
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setCustomerType('guest')}
                    className={cn('font-semibold', customerType === 'guest' ? 'text-[var(--aurora-1)]' : 'text-[var(--app-text-muted)]')}
                  >
                    Guest
                  </button>
                </div>
              </div>

              {customerType === 'member' ? (
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.memberCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <input
                  type="text"
                  placeholder="Guest Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg glass-input text-xs"
                />
              )}
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--app-text-muted)]">Payment Mode</label>
              <Select value={paymentMode} onValueChange={(val: any) => setPaymentMode(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI (GPay / PhonePe / QR)</SelectItem>
                  <SelectItem value="Cash">Cash at Register</SelectItem>
                  <SelectItem value="Card">Card POS</SelectItem>
                  <SelectItem value="Member Account">Charge to Member Ledger</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grand Total & Checkout Button */}
          <div className="space-y-3 pt-3 border-t border-[var(--app-glass-border)]">
            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between text-[var(--app-text-muted)]">
                <span>Subtotal:</span>
                <span>{formatINR(subtotalMinor)}</span>
              </div>
              <div className="flex justify-between text-[var(--app-text-muted)]">
                <span>GST (18%):</span>
                <span>{formatINR(gstMinor)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[var(--app-text-primary)] pt-1 border-t border-[var(--app-glass-border)]">
                <span>Total:</span>
                <span className="text-[var(--aurora-1)]">{formatINR(grandTotalMinor)}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full"
              disabled={cart.length === 0}
              loading={loading}
              onClick={handleCheckout}
              icon={<Receipt className="w-4 h-4" />}
            >
              Complete Sale ({formatINR(grandTotalMinor)})
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
