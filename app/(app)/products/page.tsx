'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ShoppingBag, Plus, Search, Tag, AlertTriangle,
  Receipt, X, ChevronRight, Check,
} from 'lucide-react'
import { Button } from '@/components/app/ui/button'
import { Badge } from '@/components/app/ui/badge'
import { Drawer } from '@/components/app/ui/drawer'
import { Modal } from '@/components/app/ui/modal'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
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

  // Selected Product GST breakdown for drawer
  const gstBreakdown = selectedProduct
    ? backCalculateGst(selectedProduct.list_price, selectedProduct.tax_rate)
    : null

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <span className="font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-faint)]">
            Catalogue & Master Tariffs
          </span>
          <h1 className="font-display text-[28px] sm:text-[30px] leading-[34px] font-semibold text-[var(--text)] tracking-[-0.02em] mt-0.5">
            Product Catalogue
          </h1>
          <p className="font-ui text-xs text-[var(--text-muted)] mt-1">
            {totalSKUs} Canonical SKUs across {totalCategories} categories · All prices GST-inclusive
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Product SKU
          </Button>
        </div>
      </div>

      {/* 2. Persistent Dismissible Banner for Pending Confirmation SKUs */}
      {showPendingBanner && pendingCount > 0 && (
        <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--warn-dim)] border border-[rgba(217,154,60,0.30)] flex items-start justify-between gap-3 select-none">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[var(--warn)] shrink-0 mt-0.5" />
            <div className="font-ui text-xs">
              <span className="font-semibold text-[var(--warn)]">
                {pendingCount} Annual Membership SKUs pending client package naming confirmation.
              </span>
              <p className="text-[var(--text-muted)] mt-0.5">
                Client form vs Gymex export nomenclature pending final sign-off. Click any highlighted row to inspect or edit.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPendingBanner(false)}
            className="text-[var(--text-faint)] hover:text-[var(--text)] p-1"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Search and Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'h-[30px] px-3 font-ui text-xs font-medium rounded-full cursor-pointer transition-colors whitespace-nowrap',
              categoryFilter === 'all'
                ? 'bg-[var(--surface-raised)] border border-[var(--line-strong)] text-[var(--text)]'
                : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            All Categories ({totalSKUs})
          </button>

          {getActiveCategories().map(({ category: cat, label: catLabel }) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'h-[30px] px-3 font-ui text-xs font-medium rounded-full cursor-pointer transition-colors whitespace-nowrap',
                categoryFilter === cat
                  ? 'bg-[var(--surface-raised)] border border-[var(--line-strong)] text-[var(--text)]'
                  : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]'
              )}
            >
              {catLabel}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-faint)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or category..."
            className="w-full h-[32px] pl-8 pr-3 font-ui text-xs rounded-[var(--r-sm)] bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--line-strong)] focus:ring-[2px] focus:ring-[var(--teal-dim)] outline-none"
          />
        </div>
      </div>

      {/* 4. Dense Grouped Table */}
      <div className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--surface-sunken)] border-b border-[var(--line)] sticky top-0 z-10 h-[40px] font-ui text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)] select-none">
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Product / SKU Name</th>
                <th className="px-4 py-2 text-right">Price (Incl. GST)</th>
                <th className="px-4 py-2 text-right">Tax Rate</th>
                <th className="px-4 py-2 text-center">Sessions</th>
                <th className="px-4 py-2 text-center">Validity</th>
                <th className="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {groupedProducts.map((group) => (
                <React.Fragment key={group.category}>
                  {/* Sticky Category Group Header */}
                  <tr className="bg-[var(--surface-sunken)]/70 border-y border-[var(--line)] h-[32px]">
                    <td colSpan={7} className="px-4 py-1 font-ui text-[11px] uppercase tracking-[0.08em] font-bold text-[var(--teal)]">
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
                        'group border-b border-[var(--line)] last:border-0 h-[44px] cursor-pointer transition-colors duration-140',
                        'hover:bg-[var(--surface-raised)]',
                        prod.pending_name_confirmation && 'bg-[rgba(217,154,60,0.04)]'
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <Badge status="neutral" size="sm">
                          {CATEGORY_LABELS[prod.category] || prod.category}
                        </Badge>
                      </td>

                      <td className="px-4 py-2.5 font-ui font-medium text-[13.5px] text-[var(--text)] group-hover:text-[var(--teal)] transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{prod.name}</span>
                          {prod.pending_name_confirmation && (
                            <span className="px-1.5 py-0.2 font-ui text-[9px] uppercase tracking-wider font-semibold rounded bg-[var(--warn-dim)] text-[var(--warn)]">
                              Pending Confirmation
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2.5 text-right font-data text-[13px] font-medium text-[var(--text)] tabular-nums">
                        {formatINR(prod.list_price)}
                      </td>

                      <td className="px-4 py-2.5 text-right font-data text-xs text-[var(--text-muted)] tabular-nums">
                        {(prod.tax_rate * 100).toFixed(0)}% (SAC {prod.sac_code})
                      </td>

                      <td className="px-4 py-2.5 text-center font-data text-xs text-[var(--text)] tabular-nums">
                        {prod.session_count === 1
                          ? '1 Session'
                          : prod.session_count
                          ? `${prod.session_count} Sessions`
                          : 'Unlimited'}
                      </td>

                      <td className="px-4 py-2.5 text-center font-data text-xs text-[var(--text-muted)] tabular-nums">
                        {prod.validity_days ? `${prod.validity_days} Days` : 'Tenure-Based'}
                      </td>

                      <td className="px-4 py-2.5 text-center">
                        <Badge status={prod.active ? 'ok' : 'neutral'} size="sm">
                          {prod.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Product SKU Detail Drawer (with GST Back-Calculation) */}
      <Drawer
        open={drawerOpen}
        onOpenChange={(op) => {
          setDrawerOpen(op)
          if (!op) setSelectedProduct(null)
        }}
        title={selectedProduct?.name || 'Product Details'}
        description={`Category: ${selectedProduct ? CATEGORY_LABELS[selectedProduct.category] : ''}`}
        size="md"
      >
        {selectedProduct && gstBreakdown && (
          <div className="space-y-6 select-none">
            {/* Status Alert if Pending Confirmation */}
            {selectedProduct.pending_name_confirmation && (
              <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--warn-dim)] border border-[rgba(217,154,60,0.30)] text-xs text-[var(--warn)]">
                <span className="font-semibold">Pending Client Package Naming:</span> This annual tier SKU requires final confirmation between Gymex export row and requirement form.
              </div>
            )}

            {/* Core SKU Attributes */}
            <div className="card p-4 space-y-3">
              <h4 className="font-ui text-xs uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)]">
                Catalogue Metadata
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-ui">
                <div>
                  <span className="text-[var(--text-faint)]">Product ID</span>
                  <p className="font-data text-[var(--text)] mt-0.5">{selectedProduct.id}</p>
                </div>
                <div>
                  <span className="text-[var(--text-faint)]">Status</span>
                  <div className="mt-0.5">
                    <Badge status={selectedProduct.active ? 'ok' : 'neutral'} size="sm">
                      {selectedProduct.active ? 'Active SKU' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[var(--text-faint)]">Sessions Allotted</span>
                  <p className="font-data text-[var(--text)] mt-0.5">
                    {selectedProduct.session_count === 1
                      ? '1 Session'
                      : selectedProduct.session_count
                      ? `${selectedProduct.session_count} Sessions`
                      : 'Unlimited / Non-session'}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-faint)]">Validity Tenure</span>
                  <p className="font-data text-[var(--text)] mt-0.5">
                    {selectedProduct.validity_days ? `${selectedProduct.validity_days} Days` : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedProduct.description && (
                <div className="pt-2 border-t border-[var(--line)] text-xs font-ui">
                  <span className="text-[var(--text-faint)]">Access Policy & Notes</span>
                  <p className="text-[var(--text)] mt-0.5">{selectedProduct.description}</p>
                </div>
              )}
            </div>

            {/* Statutory GST Back-Calculation Breakdown */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                <h4 className="font-ui text-xs uppercase tracking-[0.06em] font-semibold text-[var(--text-muted)]">
                  Statutory GST Breakdown
                </h4>
                <Badge status="ok" size="sm">
                  SAC {selectedProduct.sac_code}
                </Badge>
              </div>

              <div className="space-y-2 font-ui text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[var(--text-muted)]">Gross Inclusive Price</span>
                  <span className="font-data font-semibold text-[var(--text)] tabular-nums">
                    {formatINR(selectedProduct.list_price)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 text-[var(--text-faint)]">
                  <span>Taxable Supply Value</span>
                  <span className="font-data tabular-nums">{formatINR(gstBreakdown.taxable)}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-[var(--text-faint)]">
                  <span>CGST ({(selectedProduct.tax_rate * 50).toFixed(1)}%)</span>
                  <span className="font-data tabular-nums">{formatINR(gstBreakdown.cgst)}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-[var(--text-faint)]">
                  <span>SGST ({(selectedProduct.tax_rate * 50).toFixed(1)}%)</span>
                  <span className="font-data tabular-nums">{formatINR(gstBreakdown.sgst)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[var(--line)] font-medium text-[var(--teal)]">
                  <span>Total Tax Included ({(selectedProduct.tax_rate * 100).toFixed(0)}%)</span>
                  <span className="font-data tabular-nums">{formatINR(gstBreakdown.totalTax)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* 6. Create Product Modal */}
      <Modal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Create Catalogue SKU"
        description="Add a new master service or membership package"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Reformer Pilates 36-Pack (Peak)"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
              <SelectTrigger label="Category">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {getActiveCategories().map(({ category: c, label: cLabel }) => (
                  <SelectItem key={c} value={c}>
                    {cLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              label="Price (INR, GST-Inclusive)"
              type="number"
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              placeholder="e.g. 35000"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select value={String(taxRate)} onValueChange={(v) => setTaxRate(parseFloat(v))}>
              <SelectTrigger label="GST Rate">
                <SelectValue placeholder="GST Rate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.05">5% (Fitness SAC 999723)</SelectItem>
                <SelectItem value="0.18">18% (Marketing/Shoots)</SelectItem>
              </SelectContent>
            </Select>

            <Input
              label="Sessions Count"
              type="number"
              value={sessionCount}
              onChange={(e) => setSessionCount(e.target.value)}
              placeholder="e.g. 36 (or blank)"
            />

            <Input
              label="Validity (Days)"
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              placeholder="e.g. 365"
            />
          </div>

          <Input
            label="Access Policy & Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Valid MWF morning studio batches only"
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--line)]">
            <Button variant="secondary" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Catalogue SKU
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
