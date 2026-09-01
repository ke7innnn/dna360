'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ShoppingBag, Plus, Search, Tag, AlertTriangle,
  Receipt, X, ChevronRight, Check,
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import Drawer from '@/components/app/ui/drawer'
import Modal from '@/components/app/ui/modal'
import Input from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import Card from '@/components/app/ui/glass-card'
import PageHeader from '@/components/app/ui/PageHeader'
import { getProducts, createProduct, CATEGORY_LABELS, getActiveCategories } from '@/lib/products'
import { formatINR, backCalculateGst } from '@/lib/gst'
import type { Product, ProductCategory } from '@/types/product'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [showPendingBanner, setShowPendingBanner] = useState(true)

  // Form State
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('gym_membership')
  const [priceRupees, setPriceRupees] = useState('')
  const [taxRate, setTaxRate] = useState<number>(0.05)
  const [sessionCount, setSessionCount] = useState<string>('')
  const [validityDays, setValidityDays] = useState<string>('365')
  const [description, setDescription] = useState('')

  const refreshProducts = () => {
    const list = getProducts({
      search,
      category: categoryFilter as any,
    })
    setProducts(list)
  }

  useEffect(() => {
    refreshProducts()
    const handleUpdate = () => refreshProducts()
    window.addEventListener('dna360_products_updated', handleUpdate)
    return () => window.removeEventListener('dna360_products_updated', handleUpdate)
  }, [search, categoryFilter])

  // Group Products by Category
  const groupedProducts = useMemo(() => {
    const groups: { category: ProductCategory; label: string; items: Product[] }[] = []
    const categoriesPresent = Array.from(new Set(products.map((p) => p.category)))

    categoriesPresent.forEach((cat) => {
      const items = products.filter((p) => p.category === cat)
      if (items.length > 0) {
        groups.push({
          category: cat,
          label: CATEGORY_LABELS[cat] || cat,
          items,
        })
      }
    })
    return groups
  }, [products])

  const totalSKUs = products.length
  const pendingCount = products.filter((p) => p.pending_name_confirmation).length
  const totalCategories = groupedProducts.length

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const priceMinor = Math.round(parseFloat(priceRupees || '0') * 100)
    if (!name.trim() || priceMinor <= 0) {
      toast.error('Valid SKU name and price are required')
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
      is_renewal_variant: false,
      is_trial: false,
      access_window: null,
      couple: false,
      active: true,
      pending_name_confirmation: false,
      description: description.trim() || undefined,
      sort_order: products.length + 1,
    })

    toast.success(`SKU added: ${name}`)
    setCreateModalOpen(false)
    setName('')
    setPriceRupees('')
    setDescription('')
    refreshProducts()
  }

  const gstBreakdown = selectedProduct
    ? backCalculateGst(selectedProduct.list_price, selectedProduct.tax_rate)
    : null

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Header */}
      <PageHeader
        eyebrow="OPERATIONS · PRODUCT CATALOGUE"
        title="Product Catalogue"
        description={`${totalSKUs} Canonical SKUs across ${totalCategories} categories · All prices GST-inclusive with SAC classification`}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New product SKU
          </Button>
        }
      />

      {/* 2. Persistent Dismissible Banner for Pending Confirmation SKUs */}
      {showPendingBanner && pendingCount > 0 && (
        <Card className="p-4 bg-[rgba(245,158,11,0.06)] border-[rgba(245,158,11,0.25)] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[var(--amber)] shrink-0 mt-0.5" />
            <div className="font-ui text-xs">
              <span className="font-semibold text-[var(--amber)]">
                {pendingCount} Annual Membership SKUs pending package naming confirmation.
              </span>
              <p className="text-[var(--muted)] mt-0.5 leading-relaxed">
                Gymex export nomenclature verified. Click any highlighted row to inspect or edit SAC code details.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPendingBanner(false)}
            className="text-[var(--muted)] hover:text-[var(--ink)] p-1 cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </Card>
      )}

      {/* 3. Search and Category Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'h-[32px] px-3.5 font-ui text-xs font-semibold rounded-full cursor-pointer transition-all duration-140 whitespace-nowrap',
              categoryFilter === 'all'
                ? 'bg-[var(--accent-soft)] border border-[rgba(59,130,246,0.35)] text-white shadow-glow-sm'
                : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)]'
            )}
          >
            All Categories ({totalSKUs})
          </button>

          {getActiveCategories().map(({ category: cat, label: catLabel }) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'h-[32px] px-3.5 font-ui text-xs font-semibold rounded-full cursor-pointer transition-all duration-140 whitespace-nowrap',
                categoryFilter === cat
                  ? 'bg-[var(--accent-soft)] border border-[rgba(59,130,246,0.35)] text-white shadow-glow-sm'
                  : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)]'
              )}
            >
              {catLabel}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or category..."
            className="w-full h-[36px] pl-9 pr-3.5 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] outline-none"
          />
        </div>
      </div>

      {/* 4. Grouped Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg-elev)] border-b border-[var(--line)] sticky top-0 z-10 h-[44px] font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)] select-none">
                <th className="px-5 py-2.5 text-left">Category</th>
                <th className="px-5 py-2.5 text-left">Product / SKU Name</th>
                <th className="px-5 py-2.5 text-right">Price (Incl. GST)</th>
                <th className="px-5 py-2.5 text-right">Tax Rate</th>
                <th className="px-5 py-2.5 text-center">Sessions</th>
                <th className="px-5 py-2.5 text-center">Validity</th>
                <th className="px-5 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {groupedProducts.map((group) => (
                <React.Fragment key={group.category}>
                  {/* Category Header */}
                  <tr className="bg-[var(--surface-2)] border-y border-[var(--line)] h-[34px]">
                    <td colSpan={7} className="px-5 py-1 font-data text-[10.5px] uppercase tracking-[0.16em] font-bold text-[var(--accent)]">
                      {group.label} ({group.items.length} SKUs)
                    </td>
                  </tr>

                  {/* Category SKUs */}
                  {group.items.map((prod) => (
                    <tr
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod)
                        setDrawerOpen(true)
                      }}
                      className={cn(
                        'group border-b border-[var(--line-soft)] last:border-0 h-[52px] cursor-pointer transition-colors duration-140',
                        'hover:bg-[var(--surface-2)]',
                        prod.pending_name_confirmation && 'bg-[rgba(245,158,11,0.04)]'
                      )}
                    >
                      <td className="px-5 py-3">
                        <Badge status="neutral" size="sm">
                          {CATEGORY_LABELS[prod.category] || prod.category}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-ui font-semibold text-[13.5px] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                            {prod.name}
                          </span>
                          {prod.pending_name_confirmation && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-data font-semibold bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(245,158,11,0.30)]">
                              NAME PENDING
                            </span>
                          )}
                        </div>
                        {prod.description && (
                          <p className="font-ui text-xs text-[var(--muted)] line-clamp-1 mt-0.5">
                            {prod.description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-data font-bold text-[13.5px] text-[var(--ink)] tabular-nums">
                        {formatINR(prod.list_price)}
                      </td>
                      <td className="px-5 py-3 text-right font-data text-xs text-[var(--muted)] tabular-nums">
                        {(prod.tax_rate * 100).toFixed(0)}% (SAC {prod.sac_code})
                      </td>
                      <td className="px-5 py-3 text-center font-data text-xs text-[var(--ink)] tabular-nums">
                        {prod.session_count !== null ? `${prod.session_count} sess` : 'Unlimited'}
                      </td>
                      <td className="px-5 py-3 text-center font-data text-xs text-[var(--muted)] tabular-nums">
                        {prod.validity_days ? `${prod.validity_days} days` : 'Ongoing'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge status={prod.active ? 'ok' : 'neutral'} size="sm">
                          {prod.active ? 'Active' : 'Archived'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Detail Drawer */}
      {selectedProduct && gstBreakdown && (
        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={selectedProduct.name}
          description={`SKU Code: ${selectedProduct.id} · ${CATEGORY_LABELS[selectedProduct.category] || selectedProduct.category}`}
          size="md"
        >
          <div className="space-y-5 select-none font-ui">
            {/* Price & Tax Box */}
            <div className="p-5 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Total List Price (Incl. GST)
                </span>
                <span className="font-display text-2xl font-bold text-[var(--ink)] tabular-nums">
                  {formatINR(selectedProduct.list_price)}
                </span>
              </div>

              <div className="pt-3 border-t border-[var(--line)] space-y-2 text-xs">
                <div className="flex justify-between text-[var(--muted)] font-data">
                  <span>Taxable Base Value:</span>
                  <span className="text-[var(--ink)] font-semibold">{formatINR(gstBreakdown.taxable)}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)] font-data">
                  <span>GST Rate:</span>
                  <span className="text-[var(--ink)]">{(selectedProduct.tax_rate * 100).toFixed(0)}% (SAC {selectedProduct.sac_code})</span>
                </div>
                <div className="flex justify-between text-[var(--muted)] font-data">
                  <span>CGST ({(selectedProduct.tax_rate * 50).toFixed(1)}%):</span>
                  <span className="text-[var(--accent)] font-semibold">{formatINR(gstBreakdown.cgst)}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)] font-data">
                  <span>SGST ({(selectedProduct.tax_rate * 50).toFixed(1)}%):</span>
                  <span className="text-[var(--accent)] font-semibold">{formatINR(gstBreakdown.sgst)}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)] font-data pt-1 border-t border-[var(--line-soft)]">
                  <span className="font-semibold text-[var(--ink)]">Total GST Embedded:</span>
                  <span className="font-bold text-[var(--accent)]">{formatINR(gstBreakdown.totalTax)}</span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-2.5 text-xs">
              <h4 className="font-data text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--muted)]">
                Entitlement Specifications
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-data text-[10.5px] text-[var(--muted)] block">Sessions:</span>
                  <span className="font-semibold text-[var(--ink)]">
                    {selectedProduct.session_count !== null ? `${selectedProduct.session_count} Sessions` : 'Unlimited Gym Floor Access'}
                  </span>
                </div>
                <div>
                  <span className="font-data text-[10.5px] text-[var(--muted)] block">Validity:</span>
                  <span className="font-semibold text-[var(--ink)]">
                    {selectedProduct.validity_days ? `${selectedProduct.validity_days} Days (${(selectedProduct.validity_days / 30).toFixed(0)} Months)` : 'Recurring'}
                  </span>
                </div>
              </div>
            </div>

            {selectedProduct.description && (
              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] text-xs">
                <span className="font-data text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--muted)] block mb-1">
                  Product Description
                </span>
                <p className="text-[var(--ink-2)] leading-relaxed">{selectedProduct.description}</p>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* New Product Modal */}
      <Modal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Create New Product SKU"
        description="Add a canonical product to the tariff sheet with back-calculated GST rate."
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Product / Plan Name"
            placeholder="e.g. Annual Platinum Full Access"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price in INR (GST Inclusive)"
              placeholder="e.g. 56000"
              type="number"
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)]">
                Tax Rate (SAC)
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="w-full h-[38px] px-3.5 font-ui text-[13.5px] rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] outline-none"
              >
                <option value={0.05}>5% Fitness (SAC 999723)</option>
                <option value={0.18}>18% Consultation (SAC 998361)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Session Count (Blank for Unlimited)"
              placeholder="e.g. 24"
              type="number"
              value={sessionCount}
              onChange={(e) => setSessionCount(e.target.value)}
            />
            <Input
              label="Validity (Days)"
              placeholder="e.g. 365"
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
            />
          </div>

          <Input
            label="Description / Scope"
            placeholder="e.g. Turnstile access, 2 fitness evaluations, steam included"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--line)]">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Create product SKU
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
