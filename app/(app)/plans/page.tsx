'use client'

import React, { useState, useEffect } from 'react'
import {
  Layers, Plus, Search, Check, Sparkles,
  Clock, Dumbbell, ShieldCheck, Tag, CreditCard,
  Edit, Trash2, ArrowUpDown, Filter, AlertCircle,
  Copy, RefreshCw, Eye,
} from 'lucide-react'
import Button from '@/components/app/ui/button'
import Card from '@/components/app/ui/glass-card'
import Input from '@/components/app/ui/input'
import Modal from '@/components/app/ui/modal'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import PageHeader from '@/components/app/ui/PageHeader'
import Breadcrumbs from '@/components/app/ui/Breadcrumbs'
import { getStoredProducts, createProduct, CATEGORY_LABELS, saveProducts } from '@/lib/products'
import { formatINR, backCalculateGst } from '@/lib/gst'
import type { Product, ProductCategory } from '@/types/product'
import { toast } from '@/components/app/ui/toast'
import { useRouter } from 'next/navigation'

export default function MembershipPackagesPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Form State for Creating New Package
  const [packageName, setPackageName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('gym_membership')
  const [priceRupees, setPriceRupees] = useState('')
  const [durationMonths, setDurationMonths] = useState('12')
  const [customDays, setCustomDays] = useState('365')
  const [hasSessionLimit, setHasSessionLimit] = useState(false)
  const [sessionCount, setSessionCount] = useState('36')
  const [taxRate, setTaxRate] = useState<'0.05' | '0.18'>('0.05')
  const [isHappyHours, setIsHappyHours] = useState(false)
  const [inclusions, setInclusions] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = () => {
    setProducts(getStoredProducts())
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!packageName.trim() || !priceRupees) {
      toast.error('Please enter package name and list price.')
      return
    }

    const priceNum = parseFloat(priceRupees.replace(/,/g, ''))
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price in Rupees.')
      return
    }

    setLoading(true)

    try {
      const validityDays = durationMonths === 'custom' ? parseInt(customDays) || 30 : parseInt(durationMonths) * 30

      const newPkg = createProduct({
        name: packageName.trim(),
        category,
        list_price: Math.round(priceNum * 100), // convert to paise
        tax_rate: parseFloat(taxRate),
        sac_code: '999723',
        session_count: hasSessionLimit ? parseInt(sessionCount) || null : null,
        validity_days: validityDays,
        is_renewal_variant: false,
        is_trial: false,
        access_window: isHappyHours ? { start: '12:00', end: '15:30', label: 'Happy Hours' } : null,
        couple: false,
        active: true,
        sort_order: 99,
        pending_name_confirmation: false,
        description: inclusions.trim() ? `Includes: ${inclusions.trim()}` : undefined,
      })

      setLoading(false)
      toast.success(`Package Created: ${newPkg.name} (₹${priceNum.toLocaleString('en-IN')})`)
      setCreateModalOpen(false)
      loadData()

      // Reset form
      setPackageName('')
      setPriceRupees('')
      setInclusions('')
    } catch {
      setLoading(false)
      toast.error('Failed to create package.')
    }
  }

  const handleToggleActive = (id: string) => {
    const list = getStoredProducts()
    const item = list.find((p) => p.id === id)
    if (!item) return
    item.active = !item.active
    saveProducts(list)
    loadData()
    toast.success(`Package ${item.name} is now ${item.active ? 'Active' : 'Disabled'}`)
  }

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none pb-14">
      <Breadcrumbs items={[{ label: 'Operations' }, { label: 'Membership Packages' }]} />

      <PageHeader
        eyebrow="PRODUCT CATALOGUE & COMMERCIAL TARIFFS"
        title="Membership Packages"
        italicWord="& Offerings"
        description="Configure membership tiers, personal training packages, reformer bundles, and custom wellness inclusions with automated 5% GST calculation."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={loadData}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Create New Package
            </Button>
          </div>
        }
      />

      {/* ─── Summary Stats Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            Total Packages Configured
          </span>
          <p className="font-display font-bold text-3xl text-white tracking-tight">
            {products.length}
          </p>
          <span className="text-[11px] text-[#4ADE80] font-medium block">
            {products.filter((p) => p.active).length} Active for Sales
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            Gym Memberships
          </span>
          <p className="font-display font-bold text-3xl text-[#38BDF8] tracking-tight">
            {products.filter((p) => p.category === 'gym_membership').length}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium block">
            Annual &amp; Happy Hours
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            PT &amp; Coaching Bundles
          </span>
          <p className="font-display font-bold text-3xl text-[#C084FC] tracking-tight">
            {products.filter((p) => p.category.includes('pt')).length}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium block">
            Premium, Elite, Super Elite
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
            Reformer &amp; Studios
          </span>
          <p className="font-display font-bold text-3xl text-[#FB923C] tracking-tight">
            {products.filter((p) => p.category.includes('reformer') || p.category.includes('pilates')).length}
          </p>
          <span className="text-[11px] text-[var(--muted)] font-medium block">
            Allegro 2 Reformer &amp; Mat
          </span>
        </Card>
      </div>

      {/* ─── Search & Category Filters ─── */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Packages' },
              { id: 'gym_membership', label: 'Gym Memberships' },
              { id: 'premium_pt', label: 'Premium PT' },
              { id: 'elite_pt', label: 'Elite PT' },
              { id: 'reformer_pilates', label: 'Reformer Pilates' },
              { id: 'massage', label: 'Recovery / Spa' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : 'bg-white/[0.04] text-[var(--muted)] hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search package name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-3.5 h-3.5" />}
            />
          </div>
        </div>
      </Card>

      {/* ─── Packages Table ─── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-white/[0.02] border-b border-white/[0.06] text-[var(--muted)] uppercase text-[10.5px] font-semibold tracking-wider">
              <tr>
                <th className="p-3.5">Package Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Validity</th>
                <th className="p-3.5">Sessions</th>
                <th className="p-3.5 text-right">List Price (Inc. GST)</th>
                <th className="p-3.5 text-right">Taxable (Ex-Tax)</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-[var(--ink-2)]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-[var(--muted)]">
                    No packages found matching current filter. Click &ldquo;Create New Package&rdquo; to add one.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((pkg) => {
                  const gstCalc = backCalculateGst(pkg.list_price, pkg.tax_rate)
                  return (
                    <tr key={pkg.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5">
                        <p className="font-ui text-xs font-bold text-white leading-tight">
                          {pkg.name}
                        </p>
                        {pkg.description && (
                          <p className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-1 max-w-sm">
                            {pkg.description}
                          </p>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {CATEGORY_LABELS[pkg.category] || pkg.category}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-white">
                        {pkg.validity_days ? `${pkg.validity_days} Days` : 'Annual (365d)'}
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-[var(--muted)]">
                        {pkg.session_count ? (
                          <span className="text-[#A78BFA] font-bold">{pkg.session_count} Sessions</span>
                        ) : (
                          <span className="text-[#34D399]">Unlimited Access</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-white text-xs">
                        {formatINR(pkg.list_price)}
                      </td>

                      <td className="p-3.5 text-right font-mono text-[11px] text-[var(--muted)]">
                        {formatINR(gstCalc.taxable)}
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleActive(pkg.id)}
                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold cursor-pointer transition-all ${
                            pkg.active
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {pkg.active ? 'ACTIVE' : 'DISABLED'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            router.push(`/billing?preselectProductId=${pkg.id}`)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Bill Package
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Create New Package Modal ─── */}
      <Modal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Create New Membership / Session Package"
        description="Configure new offering with SAC 999723 5% GST compliance and session entitlements."
        size="lg"
      >
        <form onSubmit={handleCreatePackage} className="space-y-4">
          <Input
            label="Package Name *"
            placeholder="e.g. Annual All-Access Membership + Cryo Recovery"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Category *
              </label>
              <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gym_membership">Gym Membership (Floor Access)</SelectItem>
                  <SelectItem value="personal_training">Personal Training (General)</SelectItem>
                  <SelectItem value="premium_pt">Premium PT (Tier 1)</SelectItem>
                  <SelectItem value="elite_pt">Elite PT (Tier 2)</SelectItem>
                  <SelectItem value="super_elite_pt">Super Elite PT (Master Coach)</SelectItem>
                  <SelectItem value="reformer_pilates">Reformer Pilates Studio</SelectItem>
                  <SelectItem value="group_activity">Group Activity (Spinning, Yoga, Zumba)</SelectItem>
                  <SelectItem value="massage">Sports Massage Recovery</SelectItem>
                  <SelectItem value="ice_bath">Ice Bath Cryo-Plunge</SelectItem>
                  <SelectItem value="body_assessment">InBody Assessment Scan</SelectItem>
                  <SelectItem value="day_pass">Day Pass / Single Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              label="List Price (INR - GST Inclusive) *"
              placeholder="e.g. 55000"
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Validity Duration *
              </label>
              <Select value={durationMonths} onValueChange={setDurationMonths}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month (30 Days)</SelectItem>
                  <SelectItem value="3">3 Months (90 Days)</SelectItem>
                  <SelectItem value="6">6 Months (180 Days)</SelectItem>
                  <SelectItem value="12">12 Months / Annual (365 Days)</SelectItem>
                  <SelectItem value="custom">Custom Days...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {durationMonths === 'custom' ? (
              <Input
                label="Custom Validity (Days) *"
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                required
              />
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  Tax Classification
                </label>
                <Select value={taxRate} onValueChange={(val: any) => setTaxRate(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.05">SAC 999723 · 5% GST (Fitness Services)</SelectItem>
                    <SelectItem value="0.18">SAC 998314 · 18% GST (Rental &amp; Media)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Session Limit Toggle */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Specific Session Count</p>
                <p className="text-[11px] text-[var(--muted)]">Toggle for PT packs or Pilates punch cards</p>
              </div>
              <input
                type="checkbox"
                checked={hasSessionLimit}
                onChange={(e) => setHasSessionLimit(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </div>

            {hasSessionLimit && (
              <div className="pt-2">
                <Input
                  label="Total Sessions Included"
                  type="number"
                  placeholder="e.g. 12, 24, 36"
                  value={sessionCount}
                  onChange={(e) => setSessionCount(e.target.value)}
                  required={hasSessionLimit}
                />
              </div>
            )}
          </div>

          {/* Happy Hours Option */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div>
              <p className="text-xs font-bold text-white">Happy Hours Access Only</p>
              <p className="text-[11px] text-[var(--muted)]">Access restricted strictly between 12:00 PM and 03:30 PM</p>
            </div>
            <input
              type="checkbox"
              checked={isHappyHours}
              onChange={(e) => setIsHappyHours(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
          </div>

          {/* Inclusions / Additional Benefits */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              Additional Benefits / Inclusions (Printed on Invoice)
            </label>
            <textarea
              value={inclusions}
              onChange={(e) => setInclusions(e.target.value)}
              placeholder="e.g. Includes 2 complimentary InBody scans, 1 sports massage, 2 guest passes, and complimentary locker access."
              className="w-full h-20 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <Button variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>

            <Button variant="primary" type="submit" disabled={loading} icon={<Sparkles className="w-4 h-4" />}>
              {loading ? 'Creating...' : 'Save & Publish Package'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
