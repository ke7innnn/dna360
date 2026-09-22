'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, AlertTriangle, X, ChevronRight, Check,
  LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown,
  Layers, ShieldCheck, Clock, Dumbbell, Copy,
  SlidersHorizontal, RefreshCw, Zap
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import Badge from '@/components/app/ui/badge'
import Drawer from '@/components/app/ui/drawer'
import Modal from '@/components/app/ui/modal'
import Input from '@/components/app/ui/input'
import Card from '@/components/app/ui/glass-card'
import PageHeader from '@/components/app/ui/PageHeader'
import { getProducts, createProduct, CATEGORY_LABELS } from '@/lib/products'
import { formatINR, backCalculateGst } from '@/lib/gst'
import type { Product, ProductCategory } from '@/types/product'
import { toast } from '@/components/app/ui/toast'
import { cn } from '@/lib/utils'

// ─── Department Pillars ───
export interface DepartmentPillar {
  id: string
  label: string
  shortLabel: string
  description: string
  categories: ProductCategory[]
}

const DEPARTMENT_PILLARS: DepartmentPillar[] = [
  {
    id: 'all',
    label: 'All Offerings',
    shortLabel: 'All',
    description: 'Complete canonical tariff sheet across all departments',
    categories: [],
  },
  {
    id: 'memberships',
    label: 'Memberships & Access',
    shortLabel: 'Memberships',
    description: 'Floor memberships, Happy Hours access, day passes & corporate accounts',
    categories: ['gym_membership', 'day_pass', 'corporate'],
  },
  {
    id: 'pt',
    label: 'Personal Training',
    shortLabel: 'PT Coaching',
    description: 'Tiered 1-on-1 coaching, couple PT and customized fitness transformations',
    categories: ['personal_training', 'premium_pt', 'elite_pt', 'super_elite_pt', 'premium_couple_pt', 'elite_couple_pt'],
  },
  {
    id: 'studios',
    label: 'Pilates & Studios',
    shortLabel: 'Studios & Group',
    description: 'Reformer & Mat Pilates, Fitzone functional, CrossFit, Spinning & Yoga',
    categories: [
      'reformer_pilates', 'reformer_pilates_pt', 'mat_pilates', 'fitzone',
      'group_activity', 'crossfit', 'spinning', 'zumba', 'yoga', 'mma', 'dance_class', 'hyrox',
    ],
  },
  {
    id: 'recovery',
    label: 'Recovery & Facilities',
    shortLabel: 'Recovery',
    description: 'Sports recovery massage, ice bath cryo-therapy, InBody body scans & lockers',
    categories: ['massage', 'body_assessment', 'ice_bath', 'locker'],
  },
  {
    id: 'commercial',
    label: 'Commercial & Media',
    shortLabel: 'Commercial',
    description: 'Space rental, production video shoots, brand display & retail items',
    categories: ['marketing', 'video_shoot', 'display_item'],
  },
]

type SortField = 'standard' | 'price_asc' | 'price_desc' | 'validity_desc' | 'validity_asc' | 'sessions_desc' | 'name_asc'
type ViewMode = 'grid' | 'table'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [activePillar, setActivePillar] = useState<string>('all')
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('all')
  const [sortOption, setSortOption] = useState<SortField>('standard')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [onlyPending, setOnlyPending] = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [showPendingBanner, setShowPendingBanner] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form State for Adding New SKU
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('gym_membership')
  const [priceRupees, setPriceRupees] = useState('')
  const [taxRate, setTaxRate] = useState<number>(0.05)
  const [sessionCount, setSessionCount] = useState<string>('')
  const [validityDays, setValidityDays] = useState<string>('365')
  const [description, setDescription] = useState('')

  // Load ViewMode preference from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('dna360_product_view_mode') as ViewMode | null
      if (savedMode === 'grid' || savedMode === 'table') {
        setViewMode(savedMode)
      }
    } catch {
      // Ignore local storage errors in private browsing
    }
  }, [])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    try {
      localStorage.setItem('dna360_product_view_mode', mode)
    } catch {
      // Ignore local storage errors
    }
  }

  const refreshProducts = () => {
    const list = getProducts({})
    setProducts(list)
  }

  useEffect(() => {
    refreshProducts()
    const handleUpdate = () => refreshProducts()
    window.addEventListener('dna360_products_updated', handleUpdate)
    return () => window.removeEventListener('dna360_products_updated', handleUpdate)
  }, [])

  // Calculate Subcategories for Current Active Pillar
  const currentPillarObj = useMemo(() => {
    return DEPARTMENT_PILLARS.find((p) => p.id === activePillar) || DEPARTMENT_PILLARS[0]
  }, [activePillar])

  // Subcategories available in active pillar
  const availableSubcategories = useMemo(() => {
    if (activePillar === 'all') {
      return []
    }
    const catsInPillar = currentPillarObj.categories
    return catsInPillar
      .map((cat) => {
        const count = products.filter((p) => p.category === cat).length
        return {
          category: cat,
          label: CATEGORY_LABELS[cat] || cat,
          count,
        }
      })
      .filter((c) => c.count > 0)
  }, [activePillar, currentPillarObj, products])

  // Reset subcategory filter when changing pillar
  const handlePillarChange = (pillarId: string) => {
    setActivePillar(pillarId)
    setSubCategoryFilter('all')
  }

  // Filter and Sort Products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // 1. Pillar Filter
    if (activePillar !== 'all') {
      const allowedCategories = new Set(currentPillarObj.categories)
      result = result.filter((p) => allowedCategories.has(p.category))
    }

    // 2. Subcategory Filter
    if (subCategoryFilter !== 'all') {
      result = result.filter((p) => p.category === subCategoryFilter)
    }

    // 3. Pending Confirmation Filter
    if (onlyPending) {
      result = result.filter((p) => p.pending_name_confirmation)
    }

    // 4. Search Filter
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q)
        const catLabel = (CATEGORY_LABELS[p.category] || p.category).toLowerCase()
        const catMatch = catLabel.includes(q)
        const descMatch = p.description ? p.description.toLowerCase().includes(q) : false
        const idMatch = p.id.toLowerCase().includes(q)
        return nameMatch || catMatch || descMatch || idMatch
      })
    }

    // 5. Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'price_asc':
          return a.list_price - b.list_price
        case 'price_desc':
          return b.list_price - a.list_price
        case 'validity_desc':
          return (b.validity_days || 0) - (a.validity_days || 0)
        case 'validity_asc':
          return (a.validity_days || 9999) - (b.validity_days || 9999)
        case 'sessions_desc':
          return (b.session_count || 0) - (a.session_count || 0)
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'standard':
        default:
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }
          return a.sort_order - b.sort_order
      }
    })

    return result
  }, [products, activePillar, currentPillarObj, subCategoryFilter, onlyPending, search, sortOption])

  // Aggregate Metrics for Header Stats Strip
  const metrics = useMemo(() => {
    const total = products.length
    const pending = products.filter((p) => p.pending_name_confirmation).length
    const memberships = products.filter((p) => ['gym_membership', 'day_pass', 'corporate'].includes(p.category)).length
    const ptCoaching = products.filter((p) =>
      ['personal_training', 'premium_pt', 'elite_pt', 'super_elite_pt', 'premium_couple_pt', 'elite_couple_pt'].includes(p.category)
    ).length
    const studios = total - memberships - ptCoaching - products.filter((p) => ['marketing', 'video_shoot', 'display_item'].includes(p.category)).length

    return { total, pending, memberships, ptCoaching, studios }
  }, [products])

  // Copy SKU ID to clipboard
  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success(`SKU ID copied: ${id}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Create Product handler
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

  // Live tax preview in create modal
  const liveModalBreakdown = useMemo(() => {
    const val = parseFloat(priceRupees)
    if (isNaN(val) || val <= 0) return null
    return backCalculateGst(Math.round(val * 100), taxRate)
  }, [priceRupees, taxRate])

  const selectedProductGst = selectedProduct
    ? backCalculateGst(selectedProduct.list_price, selectedProduct.tax_rate)
    : null

  const isFiltered = activePillar !== 'all' || subCategoryFilter !== 'all' || search.trim().length > 0 || onlyPending

  const resetAllFilters = () => {
    setActivePillar('all')
    setSubCategoryFilter('all')
    setSearch('')
    setOnlyPending(false)
    setSortOption('standard')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none pb-12">
      {/* 1. Page Header */}
      <PageHeader
        eyebrow="OPERATIONS · TARIFF SCHEDULE"
        title="Product Catalogue"
        description={`${metrics.total} Canonical SKUs structured across 5 Core Pillars · All prices GST-inclusive with SAC classification`}
        actions={
          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-md)]">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] font-ui text-xs font-medium transition-all duration-140 cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-[var(--accent)] text-white shadow-glow-sm'
                    : 'text-[var(--muted)] hover:text-white'
                )}
                title="Grid Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('table')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-sm)] font-ui text-xs font-medium transition-all duration-140 cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-[var(--accent)] text-white shadow-glow-sm'
                    : 'text-[var(--muted)] hover:text-white'
                )}
                title="Compact Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* New Product SKU CTA */}
            <Button
              variant="primary"
              size="md"
              onClick={() => setCreateModalOpen(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              New SKU
            </Button>
          </div>
        }
      />

      {/* 2. Dismissible Pending Naming Confirmation Banner */}
      {showPendingBanner && metrics.pending > 0 && (
        <Card className="p-4 bg-[rgba(245,158,11,0.06)] border-[rgba(245,158,11,0.25)] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[rgba(245,158,11,0.15)] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-[var(--amber)]" />
            </div>
            <div className="font-ui text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--amber)]">
                  {metrics.pending} Annual Membership SKUs awaiting package naming sign-off.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOnlyPending(!onlyPending)
                    if (!onlyPending) setActivePillar('memberships')
                  }}
                  className="underline text-[var(--amber)] hover:text-white cursor-pointer font-medium"
                >
                  {onlyPending ? 'View all products' : 'Filter pending only'}
                </button>
              </div>
              <p className="text-[var(--muted)] mt-0.5 leading-relaxed">
                Gymex export nomenclature verified against branch tariff sheets. All active tax calculations remain compliant.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPendingBanner(false)}
            className="text-[var(--muted)] hover:text-[var(--ink)] p-1 cursor-pointer transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </Card>
      )}

      {/* 3. Executive Minimal KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)] backdrop-blur-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Total SKUs
            </span>
            <div className="font-sans font-bold tabular-nums text-xl text-[var(--ink)]">
              {metrics.total}
            </div>
            <span className="font-ui text-[11px] text-[var(--muted-2)]">Active canonical catalogue</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[rgba(59,130,246,0.1)] flex items-center justify-center text-[var(--accent)] border border-[rgba(59,130,246,0.2)]">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)] backdrop-blur-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Memberships
            </span>
            <div className="font-sans font-bold tabular-nums text-xl text-[var(--ink)]">
              {metrics.memberships}
            </div>
            <span className="font-ui text-[11px] text-[var(--muted-2)]">Floor & Happy Hour passes</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center text-emerald-400 border border-[rgba(16,185,129,0.2)]">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)] backdrop-blur-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">
              Personal Training
            </span>
            <div className="font-sans font-bold tabular-nums text-xl text-[var(--ink)]">
              {metrics.ptCoaching}
            </div>
            <span className="font-ui text-[11px] text-[var(--muted-2)]">Premium, Elite & Couple</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-purple-400 border border-[rgba(139,92,246,0.2)]">
            <Dumbbell className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)] backdrop-blur-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">
              GST SAC Invariant
            </span>
            <div className="font-sans font-bold tabular-nums text-xl text-emerald-400 flex items-center gap-1.5">
              100%
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-ui text-[11px] text-[var(--muted-2)]">SAC 999723 (5%) & 998361 (18%)</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center text-emerald-400 border border-[rgba(16,185,129,0.2)]">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4. Core Pillar Navigation Tabs */}
      <div className="space-y-3">
        {/* Top-Level Department Pillar Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DEPARTMENT_PILLARS.map((pillar) => {
            const count =
              pillar.id === 'all'
                ? products.length
                : products.filter((p) => pillar.categories.includes(p.category)).length

            const isActive = activePillar === pillar.id
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => handlePillarChange(pillar.id)}
                className={cn(
                  'h-[38px] px-4 rounded-[var(--r-md)] font-ui text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all duration-140 whitespace-nowrap',
                  isActive
                    ? 'bg-[var(--accent)] text-white shadow-glow-sm'
                    : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)]'
                )}
              >
                <span>{pillar.label}</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full font-sans font-bold text-[11px] tabular-nums',
                    isActive ? 'bg-white/20 text-white' : 'bg-[var(--surface-2)] text-[var(--muted)]'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Secondary Contextual Subcategory Row */}
        {availableSubcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-[var(--line-soft)]">
            <span className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted-2)] shrink-0 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              Subcategory:
            </span>
            <button
              type="button"
              onClick={() => setSubCategoryFilter('all')}
              className={cn(
                'h-[28px] px-3 rounded-full font-ui text-[11.5px] font-medium transition-all duration-140 cursor-pointer whitespace-nowrap',
                subCategoryFilter === 'all'
                  ? 'bg-[var(--surface-2)] border border-[rgba(59,130,246,0.4)] text-[var(--accent)] font-semibold'
                  : 'text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)]'
              )}
            >
              All in {currentPillarObj.shortLabel}
            </button>
            {availableSubcategories.map((sub) => (
              <button
                key={sub.category}
                type="button"
                onClick={() => setSubCategoryFilter(sub.category)}
                className={cn(
                  'h-[28px] px-3 rounded-full font-ui text-[11.5px] font-medium transition-all duration-140 cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                  subCategoryFilter === sub.category
                    ? 'bg-[var(--surface-2)] border border-[rgba(59,130,246,0.4)] text-[var(--accent)] font-semibold'
                    : 'text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)]'
                )}
              >
                <span>{sub.label}</span>
                <span className="text-[10px] font-sans tabular-nums opacity-70">({sub.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Minimal Search & Sorting Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-[var(--r-lg)] bg-[var(--surface)] border border-[var(--line)]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plan name, category, or SKU ID..."
            className="w-full h-[38px] pl-10 pr-9 font-ui text-xs rounded-[var(--r-md)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sorting & Filter Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Pending Filter Pill */}
          <button
            type="button"
            onClick={() => setOnlyPending(!onlyPending)}
            className={cn(
              'h-[38px] px-3.5 rounded-[var(--r-md)] font-ui text-xs font-medium border flex items-center gap-2 cursor-pointer transition-colors',
              onlyPending
                ? 'bg-[var(--amber-dim)] text-[var(--amber)] border-[rgba(245,158,11,0.35)]'
                : 'bg-[var(--bg-elev)] text-[var(--muted)] border-[var(--line)] hover:text-white hover:border-[var(--line-strong)]'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pending Naming ({metrics.pending})</span>
          </button>

          {/* Minimal Sort Dropdown */}
          <div className="flex items-center gap-2 bg-[var(--bg-elev)] border border-[var(--line)] rounded-[var(--r-md)] px-3 h-[38px]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
            <span className="font-data text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted)] shrink-0">
              Sort:
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortField)}
              className="bg-transparent font-ui text-xs text-[var(--ink)] outline-none cursor-pointer pr-2"
            >
              <option value="standard" className="bg-[var(--bg)] text-[var(--ink)]">Standard Tariff Order</option>
              <option value="price_asc" className="bg-[var(--bg)] text-[var(--ink)]">Price: Low to High</option>
              <option value="price_desc" className="bg-[var(--bg)] text-[var(--ink)]">Price: High to Low</option>
              <option value="validity_desc" className="bg-[var(--bg)] text-[var(--ink)]">Validity: Longest First</option>
              <option value="validity_asc" className="bg-[var(--bg)] text-[var(--ink)]">Validity: Shortest First</option>
              <option value="sessions_desc" className="bg-[var(--bg)] text-[var(--ink)]">Sessions: Most to Least</option>
              <option value="name_asc" className="bg-[var(--bg)] text-[var(--ink)]">Alphabetical (A–Z)</option>
            </select>
          </div>

          {/* Reset Filters CTA if filtered */}
          {isFiltered && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="h-[38px] px-3 rounded-[var(--r-md)] font-ui text-xs text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count & Current Active State */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)] px-1">
        <div>
          Showing <span className="font-sans font-bold tabular-nums text-[var(--ink)]">{filteredAndSortedProducts.length}</span> of {products.length} canonical SKUs
          {activePillar !== 'all' && (
            <span className="ml-1 text-[var(--accent)]">· {currentPillarObj.label}</span>
          )}
          {subCategoryFilter !== 'all' && (
            <span className="ml-1 text-[var(--accent)]">· {CATEGORY_LABELS[subCategoryFilter as ProductCategory]}</span>
          )}
        </div>

        {/* Quick price range preview */}
        {filteredAndSortedProducts.length > 0 && (
          <div className="font-data text-[11px] text-[var(--muted-2)]">
            Range:{' '}
            <span className="font-sans tabular-nums text-[var(--ink)]">
              {formatINR(Math.min(...filteredAndSortedProducts.map((p) => p.list_price)))}
            </span>
            {' – '}
            <span className="font-sans tabular-nums text-[var(--ink)]">
              {formatINR(Math.max(...filteredAndSortedProducts.map((p) => p.list_price)))}
            </span>
          </div>
        )}
      </div>

      {/* 6. Product Catalogue View (Grid vs Table) */}
      {filteredAndSortedProducts.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto text-[var(--muted)]">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-ui font-semibold text-base text-[var(--ink)]">No products matched your criteria</h3>
            <p className="font-ui text-xs text-[var(--muted)] max-w-sm mx-auto">
              Try adjusting your search keywords, clear active category filters, or reset to view the entire tariff sheet.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={resetAllFilters}>
            Reset all filters
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* ─── CARD GRID VIEW ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedProducts.map((prod) => {
            const gst = backCalculateGst(prod.list_price, prod.tax_rate)
            const isPending = prod.pending_name_confirmation

            return (
              <div
                key={prod.id}
                onClick={() => {
                  setSelectedProduct(prod)
                  setDrawerOpen(true)
                }}
                className={cn(
                  'group relative p-5 rounded-[var(--r-xl)] bg-[var(--surface)] border border-[var(--line)] backdrop-blur-md',
                  'transition-all duration-200 cursor-pointer hover:border-[rgba(59,130,246,0.35)] hover:shadow-glow-sm hover:-translate-y-0.5',
                  isPending && 'border-[rgba(245,158,11,0.25)] bg-gradient-to-b from-[rgba(245,158,11,0.02)] to-transparent'
                )}
              >
                {/* Header Row: Category & Tax Pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-data text-[10px] uppercase tracking-[0.14em] font-semibold text-[var(--accent)] px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line)] truncate">
                    {CATEGORY_LABELS[prod.category] || prod.category}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-data text-[10px] text-[var(--muted)] px-2 py-0.5 rounded bg-[var(--bg-elev)] border border-[var(--line-soft)]">
                      {(prod.tax_rate * 100).toFixed(0)}% SAC {prod.sac_code}
                    </span>
                  </div>
                </div>

                {/* SKU Title */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-ui font-semibold text-[14.5px] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                      {prod.name}
                    </h3>
                  </div>

                  {isPending && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-data font-semibold bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(245,158,11,0.3)]">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      PENDING NAMING
                    </span>
                  )}

                  {prod.description && (
                    <p className="font-ui text-xs text-[var(--muted)] line-clamp-2 leading-relaxed pt-0.5">
                      {prod.description}
                    </p>
                  )}
                </div>

                {/* Price Display */}
                <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line-soft)] mb-4 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-sans font-bold tabular-nums text-2xl text-[var(--ink)] tracking-tight">
                      {formatINR(prod.list_price)}
                    </span>
                    <span className="font-data text-[10.5px] text-[var(--muted)]">
                      Incl. {(prod.tax_rate * 100).toFixed(0)}% GST
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px] font-data text-[var(--muted-2)] pt-1 border-t border-[var(--line-soft)]">
                    <span>Taxable: {formatINR(gst.taxable)}</span>
                    <span className="text-[var(--accent)]">GST: {formatINR(gst.totalTax)}</span>
                  </div>
                </div>

                {/* Entitlement Chips */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--line-soft)] text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--muted)]">
                    <Dumbbell className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                    <span className="font-sans tabular-nums font-medium text-[var(--ink)] truncate">
                      {prod.session_count !== null ? `${prod.session_count} Sessions` : 'Unlimited Floor'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[var(--muted)]">
                    <Clock className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                    <span className="font-sans tabular-nums font-medium text-[var(--ink)] truncate">
                      {prod.validity_days ? `${prod.validity_days} Days` : 'Ongoing'}
                    </span>
                  </div>
                </div>

                {/* Hover Footer Action */}
                <div className="mt-3.5 pt-2.5 flex items-center justify-between text-[11px] font-ui text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                  <span className="font-data text-[10px] text-[var(--muted-2)]">
                    ID: {prod.id}
                  </span>
                  <div className="flex items-center gap-1 font-medium">
                    <span>Inspect Breakdown</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ─── STREAMLINED TABLE VIEW ─── */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--bg-elev)] border-b border-[var(--line)] sticky top-0 z-10 h-[44px] font-data text-[10.5px] uppercase tracking-[0.14em] font-medium text-[var(--muted)] select-none">
                  <th
                    className="px-5 py-2.5 text-left cursor-pointer hover:text-white transition-colors"
                    onClick={() => setSortOption(sortOption === 'name_asc' ? 'standard' : 'name_asc')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product / SKU Name</span>
                      {sortOption === 'name_asc' && <ArrowUp className="w-3 h-3 text-[var(--accent)]" />}
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-left">Category</th>
                  <th
                    className="px-5 py-2.5 text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => setSortOption(sortOption === 'price_desc' ? 'price_asc' : 'price_desc')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Price (Incl. GST)</span>
                      {sortOption === 'price_asc' && <ArrowUp className="w-3 h-3 text-[var(--accent)]" />}
                      {sortOption === 'price_desc' && <ArrowDown className="w-3 h-3 text-[var(--accent)]" />}
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-right">Tax Rate / SAC</th>
                  <th
                    className="px-5 py-2.5 text-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => setSortOption(sortOption === 'sessions_desc' ? 'standard' : 'sessions_desc')}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Sessions</span>
                      {sortOption === 'sessions_desc' && <ArrowDown className="w-3 h-3 text-[var(--accent)]" />}
                    </div>
                  </th>
                  <th
                    className="px-5 py-2.5 text-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => setSortOption(sortOption === 'validity_desc' ? 'validity_asc' : 'validity_desc')}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Validity</span>
                      {sortOption === 'validity_desc' && <ArrowDown className="w-3 h-3 text-[var(--accent)]" />}
                      {sortOption === 'validity_asc' && <ArrowUp className="w-3 h-3 text-[var(--accent)]" />}
                    </div>
                  </th>
                  <th className="px-5 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProducts.map((prod) => (
                  <tr
                    key={prod.id}
                    onClick={() => {
                      setSelectedProduct(prod)
                      setDrawerOpen(true)
                    }}
                    className={cn(
                      'group border-b border-[var(--line-soft)] last:border-0 h-[52px] cursor-pointer transition-colors duration-140',
                      'hover:bg-[var(--surface-2)]',
                      prod.pending_name_confirmation && 'bg-[rgba(245,158,11,0.03)]'
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-ui font-semibold text-[13.5px] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                          {prod.name}
                        </span>
                        {prod.pending_name_confirmation && (
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-data font-semibold bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(245,158,11,0.3)]">
                            NAME PENDING
                          </span>
                        )}
                      </div>
                      {prod.description && (
                        <p className="font-ui text-xs text-[var(--muted)] line-clamp-1 mt-0.5 max-w-lg">
                          {prod.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge status="neutral" size="sm">
                        {CATEGORY_LABELS[prod.category] || prod.category}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-sans font-bold text-[13.5px] text-[var(--ink)] tabular-nums">
                      {formatINR(prod.list_price)}
                    </td>
                    <td className="px-5 py-3 text-right font-data text-xs text-[var(--muted)] tabular-nums">
                      {(prod.tax_rate * 100).toFixed(0)}% (SAC {prod.sac_code})
                    </td>
                    <td className="px-5 py-3 text-center font-sans text-xs text-[var(--ink)] tabular-nums">
                      {prod.session_count !== null ? `${prod.session_count} sess` : 'Unlimited'}
                    </td>
                    <td className="px-5 py-3 text-center font-sans text-xs text-[var(--muted)] tabular-nums">
                      {prod.validity_days ? `${prod.validity_days} days` : 'Ongoing'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge status={prod.active ? 'ok' : 'neutral'} size="sm">
                        {prod.active ? 'Active' : 'Archived'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(prod.id, e)}
                        title="Copy SKU ID"
                        className="p-1.5 text-[var(--muted)] hover:text-white rounded-[var(--r-sm)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                      >
                        {copiedId === prod.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 7. Product Detail & GST Inspection Drawer */}
      {selectedProduct && selectedProductGst && (
        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={selectedProduct.name}
          description={`SKU Code: ${selectedProduct.id} · ${CATEGORY_LABELS[selectedProduct.category] || selectedProduct.category}`}
          size="md"
        >
          <div className="space-y-5 select-none font-ui">
            {/* Pending Notice in Drawer */}
            {selectedProduct.pending_name_confirmation && (
              <div className="p-3.5 rounded-[var(--r-md)] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] text-xs text-[var(--amber)] flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Annual Package Naming Confirmation Pending</span>
                  <p className="text-[var(--muted)] mt-0.5 leading-relaxed">
                    Nomenclature is reconciled with Gymex export data. The GST rate and pricing logic are operational and valid.
                  </p>
                </div>
              </div>
            )}

            {/* Price & Tax Box */}
            <div className="p-5 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-data text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Total List Price (Incl. GST)
                </span>
                <span className="font-sans text-2xl font-bold text-[var(--ink)] tabular-nums">
                  {formatINR(selectedProduct.list_price)}
                </span>
              </div>

              <div className="pt-3 border-t border-[var(--line)] space-y-2 text-xs">
                <div className="flex justify-between text-[var(--muted)] font-data">
                  <span>Taxable Base Value:</span>
                  <span className="text-[var(--ink)] font-semibold font-sans tabular-nums">
                    {formatINR(selectedProductGst.taxable)}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)] font-data">
                  <span>GST Classification:</span>
                  <span className="text-[var(--ink)]">
                    {(selectedProduct.tax_rate * 100).toFixed(0)}% (SAC {selectedProduct.sac_code})
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)] font-data">
                  <span>CGST ({(selectedProduct.tax_rate * 50).toFixed(1)}%):</span>
                  <span className="text-[var(--accent)] font-semibold font-sans tabular-nums">
                    {formatINR(selectedProductGst.cgst)}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)] font-data">
                  <span>SGST ({(selectedProduct.tax_rate * 50).toFixed(1)}%):</span>
                  <span className="text-[var(--accent)] font-semibold font-sans tabular-nums">
                    {formatINR(selectedProductGst.sgst)}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)] font-data pt-2 border-t border-[var(--line-soft)]">
                  <span className="font-semibold text-[var(--ink)]">Total GST Liability Embedded:</span>
                  <span className="font-bold text-[var(--accent)] font-sans tabular-nums">
                    {formatINR(selectedProductGst.totalTax)}
                  </span>
                </div>
              </div>
            </div>

            {/* Specifications & Entitlements */}
            <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] space-y-3 text-xs">
              <h4 className="font-data text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--muted)]">
                Entitlement Specifications
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-data text-[10.5px] text-[var(--muted)] block">Sessions Entitled:</span>
                  <span className="font-semibold text-[var(--ink)] font-sans tabular-nums">
                    {selectedProduct.session_count !== null
                      ? `${selectedProduct.session_count} Sessions`
                      : 'Unlimited Floor Access'}
                  </span>
                </div>
                <div>
                  <span className="font-data text-[10.5px] text-[var(--muted)] block">Validity Window:</span>
                  <span className="font-semibold text-[var(--ink)] font-sans tabular-nums">
                    {selectedProduct.validity_days
                      ? `${selectedProduct.validity_days} Days (~${(selectedProduct.validity_days / 30).toFixed(0)} Mo)`
                      : 'Recurring'}
                  </span>
                </div>

                {selectedProduct.access_window && (
                  <div className="col-span-2 pt-2 border-t border-[var(--line-soft)]">
                    <span className="font-data text-[10.5px] text-[var(--muted)] block">Access Time Restriction:</span>
                    <span className="font-semibold text-[var(--amber)]">
                      {selectedProduct.access_window.start} – {selectedProduct.access_window.end} ({selectedProduct.access_window.label})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedProduct.description && (
              <div className="p-4 rounded-[var(--r-md)] bg-[var(--surface-2)] border border-[var(--line)] text-xs space-y-1">
                <span className="font-data text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--muted)] block">
                  Product Description
                </span>
                <p className="text-[var(--ink-2)] leading-relaxed">{selectedProduct.description}</p>
              </div>
            )}

            {/* Actions in Drawer */}
            <div className="pt-2 flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => handleCopyId(selectedProduct.id)}
                icon={copiedId === selectedProduct.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                className="flex-1"
              >
                {copiedId === selectedProduct.id ? 'SKU ID Copied' : 'Copy SKU ID'}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setDrawerOpen(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* 8. New Product SKU Modal with Live Tax Calculator */}
      <Modal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Create New Product SKU"
        description="Add a canonical product to the tariff sheet with automatic GST back-calculation."
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
                className="w-full h-[38px] px-3.5 font-ui text-[13.5px] rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none"
              >
                <option value={0.05} className="bg-[var(--bg)] text-[var(--ink)]">5% Fitness (SAC 999723)</option>
                <option value={0.18} className="bg-[var(--bg)] text-[var(--ink)]">18% Space/Media (SAC 998361)</option>
              </select>
            </div>
          </div>

          {/* Live GST Computation Preview in Form */}
          {liveModalBreakdown && (
            <div className="p-3 rounded-[var(--r-sm)] bg-[var(--surface-2)] border border-[var(--line)] text-xs space-y-1 font-data">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Taxable Base:</span>
                <span className="text-[var(--ink)] font-sans tabular-nums font-semibold">
                  {formatINR(liveModalBreakdown.taxable)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Total GST ({taxRate * 100}%):</span>
                <span className="text-[var(--accent)] font-sans tabular-nums font-semibold">
                  {formatINR(liveModalBreakdown.totalTax)} (CGST: {formatINR(liveModalBreakdown.cgst)} + SGST: {formatINR(liveModalBreakdown.sgst)})
                </span>
              </div>
            </div>
          )}

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

          <div className="flex flex-col gap-1.5">
            <label className="font-data text-[10.5px] uppercase tracking-[0.16em] font-medium text-[var(--muted)]">
              Category Pillar
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full h-[38px] px-3.5 font-ui text-[13.5px] rounded-[var(--r-sm)] bg-[var(--bg-elev)] border border-[var(--line)] text-[var(--ink)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none"
            >
              <option value="gym_membership" className="bg-[var(--bg)]">Gym Membership</option>
              <option value="day_pass" className="bg-[var(--bg)]">Day Pass</option>
              <option value="corporate" className="bg-[var(--bg)]">Corporate</option>
              <option value="personal_training" className="bg-[var(--bg)]">Personal Training</option>
              <option value="premium_pt" className="bg-[var(--bg)]">Premium PT</option>
              <option value="elite_pt" className="bg-[var(--bg)]">Elite PT</option>
              <option value="super_elite_pt" className="bg-[var(--bg)]">Super Elite PT</option>
              <option value="reformer_pilates" className="bg-[var(--bg)]">Reformer Pilates</option>
              <option value="mat_pilates" className="bg-[var(--bg)]">Mat Pilates</option>
              <option value="massage" className="bg-[var(--bg)]">Massage</option>
              <option value="ice_bath" className="bg-[var(--bg)]">Ice Bath</option>
              <option value="locker" className="bg-[var(--bg)]">Locker</option>
              <option value="marketing" className="bg-[var(--bg)]">Marketing Display (18%)</option>
              <option value="video_shoot" className="bg-[var(--bg)]">Video Shoot (18%)</option>
            </select>
          </div>

          <Input
            label="Description / Scope"
            placeholder="e.g. Turnstile access, fitness evaluation, steam included"
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
