'use client'

import React, { useState, useEffect } from 'react'
import {
  ShoppingBag, Plus, Search, Filter, Sparkles, Tag,
  Clock, ShieldAlert, CheckCircle2, AlertTriangle, Layers,
  Receipt, ArrowUpRight,
} from 'lucide-react'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { Button } from '@/components/app/ui/button'
import { StatusPill } from '@/components/app/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { Modal } from '@/components/app/ui/modal'
import { Input } from '@/components/app/ui/input'
import { getProducts, createProduct, CATEGORY_LABELS, getActiveCategories } from '@/lib/products'
import { formatINR, backCalculateGst } from '@/lib/gst'
import type { Product, ProductCategory } from '@/types/product'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // New Product Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('gym_membership')
  const [priceRupees, setPriceRupees] = useState('')
  const [taxRate, setTaxRate] = useState<number>(0.05)
  const [sessionCount, setSessionCount] = useState<string>('')
  const [validityDays, setValidityDays] = useState<string>('365')
  const [isRenewal, setIsRenewal] = useState(false)
  const [isTrial, setIsTrial] = useState(false)
  const [description, setDescription] = useState('')

  const refreshProducts = () => {
    const list = getProducts({
      search,
      category: categoryFilter as any,
      active: activeFilter === 'all' ? 'all' : activeFilter === 'active',
    })
    setProducts(list)
  }

  useEffect(() => {
    refreshProducts()
    const handleUpdate = () => refreshProducts()
    window.addEventListener('dna360_products_updated', handleUpdate)
    return () => window.removeEventListener('dna360_products_updated', handleUpdate)
  }, [search, categoryFilter, activeFilter])

  const categories = getActiveCategories()
  const totalCatalogueValue = products.reduce((acc, p) => acc + p.list_price, 0)
  const pendingConfirmationCount = products.filter(p => p.pending_name_confirmation).length

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const priceMinor = Math.round(parseFloat(priceRupees || '0') * 100)
    if (!name.trim() || priceMinor <= 0) {
      toast.error('Product name and valid price are required')
      return
    }

    createProduct({
      name: name.trim(),
      category,
      list_price: priceMinor,
      tax_rate: taxRate,
      sac_code: taxRate === 0.18 ? '998361' : '999723',
      session_count: sessionCount ? parseInt(sessionCount, 10) : null,
      validity_days: validityDays ? parseInt(validityDays, 10) : null,
      is_renewal_variant: isRenewal,
      is_trial: isTrial,
      access_window: null,
      couple: false,
      active: true,
      pending_name_confirmation: false,
      description: description.trim() || undefined,
      sort_order: products.length + 1,
    })

    toast.success(`Product added: ${name}`)
    setCreateModalOpen(false)
    setName('')
    setPriceRupees('')
    setDescription('')
    refreshProducts()
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">
            Product Catalogue & Pricing
          </h1>
          <p className="text-sm text-[var(--app-text-secondary)] mt-1">
            Canonical SKUs across 24 categories. All prices are GST-inclusive with automated 5% fitness & 18% marketing back-calculation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add New Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Catalogue SKUs"
          value={products.length}
          icon={<ShoppingBag className="w-5 h-5 text-[var(--aurora-1)]" />}
        />
        <StatCard
          label="Product Categories"
          value={categories.length}
          icon={<Layers className="w-5 h-5 text-teal-400" />}
        />
        <StatCard
          label="Pending Name Confirmation"
          value={pendingConfirmationCount}
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          label="Standard Tax Rate"
          value="5% GST (Inclusive)"
          icon={<Receipt className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Filter Bar */}
      <GlassCard padding="sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-text-muted)]" />
            <input
              type="text"
              placeholder="Search product title, category, SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs glass-input text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-focus-ring)]"
            />
          </div>

          <div className="w-full md:w-64">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Category: All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories ({categories.reduce((a, c) => a + c.count, 0)})</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.category} value={c.category}>
                    {c.label} ({c.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-36">
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger><SelectValue placeholder="Status: All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => {
          const gst = backCalculateGst(p.list_price, p.tax_rate)
          return (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="p-5 rounded-2xl glass-card hover:border-[var(--aurora-1)]/50 transition-all cursor-pointer space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[0.625rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--app-glass-bg)] border border-[var(--app-glass-border)] text-teal-400">
                    {CATEGORY_LABELS[p.category] || p.category}
                  </span>
                  <div className="flex items-center gap-1">
                    {p.is_trial && (
                      <span className="text-[0.625rem] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        TRIAL
                      </span>
                    )}
                    {p.is_renewal_variant && (
                      <span className="text-[0.625rem] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        RENEWAL
                      </span>
                    )}
                    {p.pending_name_confirmation && (
                      <span className="text-[0.625rem] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30" title="Disputed name in legacy data">
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-sm text-[var(--app-text-primary)] group-hover:text-[var(--aurora-1)] transition-colors">
                  {p.name}
                </h3>

                {p.description && (
                  <p className="text-xs text-[var(--app-text-muted)] line-clamp-2">
                    {p.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--app-glass-border)] space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-bold text-[var(--app-text-primary)]">
                    {formatINR(p.list_price)}
                  </span>
                  <span className="text-[0.6875rem] text-emerald-400 font-mono">
                    Includes {(p.tax_rate * 100)}% GST
                  </span>
                </div>

                {/* Back-calculated Breakdown */}
                <div className="grid grid-cols-3 gap-1 text-[0.6875rem] font-mono text-[var(--app-text-muted)] bg-[var(--app-glass-bg)] p-2 rounded-lg">
                  <div>
                    <span className="block text-[0.5625rem] uppercase">Taxable</span>
                    <span className="text-[var(--app-text-secondary)]">{formatINR(gst.taxable)}</span>
                  </div>
                  <div>
                    <span className="block text-[0.5625rem] uppercase">CGST ({p.tax_rate * 50}%)</span>
                    <span className="text-[var(--app-text-secondary)]">{formatINR(gst.cgst)}</span>
                  </div>
                  <div>
                    <span className="block text-[0.5625rem] uppercase">SGST ({p.tax_rate * 50}%)</span>
                    <span className="text-[var(--app-text-secondary)]">{formatINR(gst.sgst)}</span>
                  </div>
                </div>

                {/* Validity & Limits */}
                <div className="flex items-center justify-between text-[0.6875rem] text-[var(--app-text-muted)] pt-1">
                  <span>
                    {p.session_count ? `${p.session_count} Sessions` : 'Unlimited Sessions'}
                  </span>
                  <span>
                    {p.validity_days ? `${p.validity_days} Days Validity` : 'Custom Duration'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Product Modal */}
      <Modal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Add Product to Catalogue"
        description="Create a new GST-inclusive purchasable plan or service."
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Product Title *"
            placeholder="e.g. Annual Gym Membership Package 2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--app-text-secondary)]">Category *</label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              label="GST-Inclusive Price (₹) *"
              type="number"
              placeholder="e.g. 43500"
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--app-text-secondary)]">Tax Rate</label>
              <Select value={String(taxRate)} onValueChange={(v) => setTaxRate(parseFloat(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.05">5% (Fitness Services - SAC 999723)</SelectItem>
                  <SelectItem value="0.18">18% (Marketing / Space Rental)</SelectItem>
                  <SelectItem value="0">0% (Exempt)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              label="Sessions Count (Optional)"
              type="number"
              placeholder="e.g. 36 (blank for unlimited)"
              value={sessionCount}
              onChange={(e) => setSessionCount(e.target.value)}
            />

            <Input
              label="Validity (Days)"
              type="number"
              placeholder="e.g. 365"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
            />
          </div>

          <Input
            label="Product Notes / Special Inclusions"
            placeholder="e.g. Includes 2-Month InBody composition assessments"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex items-center gap-6 text-xs text-[var(--app-text-secondary)] pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isTrial} onChange={(e) => setIsTrial(e.target.checked)} className="rounded" />
              <span>Is Trial Product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isRenewal} onChange={(e) => setIsRenewal(e.target.checked)} className="rounded" />
              <span>Is Renewal Variant</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--app-glass-border)]">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<Plus className="w-4 h-4" />}>
              Save to Catalogue
            </Button>
          </div>
        </form>
      </Modal>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          open={!!selectedProduct}
          onOpenChange={(open) => !open && setSelectedProduct(null)}
          title={selectedProduct.name}
          description={`SKU: ${selectedProduct.id} · Category: ${CATEGORY_LABELS[selectedProduct.category] || selectedProduct.category}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl glass-card border border-[var(--aurora-1)]/30 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[var(--app-text-muted)]">GST-Inclusive List Price</span>
                <span className="font-display text-2xl font-bold text-[var(--app-text-primary)]">
                  {formatINR(selectedProduct.list_price)}
                </span>
              </div>

              {/* Tax Back-calculation Breakdown */}
              <div className="p-3 rounded-xl glass-input space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-[var(--app-text-secondary)]">
                  <span>Taxable Base (Ex-Tax):</span>
                  <span>{formatINR(backCalculateGst(selectedProduct.list_price, selectedProduct.tax_rate).taxable)}</span>
                </div>
                <div className="flex justify-between text-[var(--app-text-secondary)]">
                  <span>CGST (2.5%):</span>
                  <span>{formatINR(backCalculateGst(selectedProduct.list_price, selectedProduct.tax_rate).cgst)}</span>
                </div>
                <div className="flex justify-between text-[var(--app-text-secondary)]">
                  <span>SGST (2.5%):</span>
                  <span>{formatINR(backCalculateGst(selectedProduct.list_price, selectedProduct.tax_rate).sgst)}</span>
                </div>
                <div className="flex justify-between font-bold text-[var(--aurora-1)] pt-1 border-t border-[var(--app-glass-border)]">
                  <span>Total Tax Included:</span>
                  <span>{formatINR(backCalculateGst(selectedProduct.list_price, selectedProduct.tax_rate).totalTax)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl glass-card">
                <span className="text-[var(--app-text-muted)] block">SAC Code</span>
                <span className="font-mono font-semibold">{selectedProduct.sac_code}</span>
              </div>
              <div className="p-3 rounded-xl glass-card">
                <span className="text-[var(--app-text-muted)] block">Tax Rate</span>
                <span className="font-mono font-semibold">{selectedProduct.tax_rate * 100}% GST</span>
              </div>
              <div className="p-3 rounded-xl glass-card">
                <span className="text-[var(--app-text-muted)] block">Session Allowance</span>
                <span className="font-semibold">{selectedProduct.session_count ? `${selectedProduct.session_count} Sessions` : 'Unlimited'}</span>
              </div>
              <div className="p-3 rounded-xl glass-card">
                <span className="text-[var(--app-text-muted)] block">Validity Window</span>
                <span className="font-semibold">{selectedProduct.validity_days ? `${selectedProduct.validity_days} Days` : 'N/A'}</span>
              </div>
            </div>

            {selectedProduct.description && (
              <div className="p-3.5 rounded-xl glass-input text-xs text-[var(--app-text-secondary)]">
                <strong>Description:</strong> {selectedProduct.description}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedProduct(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
