'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, TrendingUp, CreditCard, Activity,
  Search, Mail, Lock, Calendar as CalendarIcon,
  Plus, Download, Trash2, Edit, Eye, Filter,
  CheckCircle, XCircle, Clock, AlertCircle, Info,
} from 'lucide-react'

import { useTheme } from '@/components/app/theme/ThemeProvider'
import GlassCard from '@/components/app/ui/glass-card'
import StatCard from '@/components/app/ui/stat-card'
import { Button } from '@/components/app/ui/button'
import { Input } from '@/components/app/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/app/ui/select'
import { Badge, StatusPill } from '@/components/app/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/app/ui/tabs'
import { Modal } from '@/components/app/ui/modal'
import { Drawer } from '@/components/app/ui/drawer'
import { DataTable, type DataTableColumn } from '@/components/app/ui/data-table'
import { toast } from '@/components/app/ui/toast'
import { Skeleton, SkeletonCard } from '@/components/app/ui/skeleton'
import { EmptyState } from '@/components/app/ui/empty-state'
import { ConfirmDialog } from '@/components/app/ui/confirm-dialog'
import { DatePicker } from '@/components/app/ui/date-picker'
import { formatINR } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'

// ─── Section wrapper ───
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-[var(--app-text-primary)] tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  )
}

// ─── Colour swatch ───
function Swatch({ name, value, textClass }: { name: string; value: string; textClass?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl border border-[var(--app-glass-border)]"
        style={{ background: value }}
      />
      <div>
        <p className={`text-sm font-medium ${textClass || 'text-[var(--app-text-primary)]'}`}>{name}</p>
        <p className="text-xs text-[var(--app-text-muted)] tabular-nums font-mono">{value}</p>
      </div>
    </div>
  )
}

// ─── Mock table data ───
interface MockMember {
  id: string
  name: string
  email: string
  plan: string
  status: 'active' | 'expiring' | 'expired' | 'frozen'
  balance: number
  joined: string
}

const mockMembers: MockMember[] = [
  { id: '1', name: 'Arjun Mehta', email: 'arjun@mail.com', plan: 'Annual Premium', status: 'active', balance: 0, joined: '2025-01-15' },
  { id: '2', name: 'Priya Sharma', email: 'priya@mail.com', plan: 'Quarterly', status: 'expiring', balance: 250000, joined: '2024-11-20' },
  { id: '3', name: 'Rahul Desai', email: 'rahul@mail.com', plan: 'Monthly', status: 'expired', balance: 500000, joined: '2024-06-01' },
  { id: '4', name: 'Sneha Patel', email: 'sneha@mail.com', plan: 'Annual', status: 'active', balance: 0, joined: '2025-03-10' },
  { id: '5', name: 'Vikram Singh', email: 'vikram@mail.com', plan: 'PT Package', status: 'frozen', balance: 150000, joined: '2024-09-05' },
]

const mockColumns: DataTableColumn<MockMember>[] = [
  { id: 'name', header: 'Member', accessorKey: 'name', sortable: true,
    cell: (val, row) => (
      <div>
        <p className="font-medium text-[var(--app-text-primary)]">{row.name}</p>
        <p className="text-xs text-[var(--app-text-muted)]">{row.email}</p>
      </div>
    ),
  },
  { id: 'plan', header: 'Plan', accessorKey: 'plan', sortable: true },
  {
    id: 'status', header: 'Status', accessorKey: 'status', sortable: true,
    cell: (val) => {
      const s = val as MockMember['status']
      const map = {
        active: { status: 'success' as const, label: 'Active' },
        expiring: { status: 'warning' as const, label: 'Expiring' },
        expired: { status: 'danger' as const, label: 'Expired' },
        frozen: { status: 'info' as const, label: 'Frozen' },
      }
      const { status, label } = map[s]
      return <StatusPill status={status} dot>{label}</StatusPill>
    },
  },
  {
    id: 'balance', header: 'Balance', accessorKey: 'balance', sortable: true, align: 'right',
    cell: (val) => {
      const v = val as number
      return <span className={v > 0 ? 'text-[var(--app-danger)]' : ''}>{formatINR(v)}</span>
    },
  },
]

// ─── Main Page ───
export default function DesignSystemPage() {
  const { resolvedTheme, toggleTheme } = useTheme()

  // State for interactive demos
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDangerOpen, setConfirmDangerOpen] = useState(false)
  const [dateValue, setDateValue] = useState<Date | undefined>()
  const [selectValue, setSelectValue] = useState('')
  const [tableState, setTableState] = useState<'loading' | 'success' | 'error' | 'empty'>('success')
  const [tablePage, setTablePage] = useState(1)
  const [tableSort, setTableSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({ column: 'name', direction: 'asc' })
  const [btnLoading, setBtnLoading] = useState(false)

  const handleSort = (col: string) => {
    setTableSort((prev) => ({
      column: col,
      direction: prev.column === col && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  return (
    <motion.div
      className="space-y-12 max-w-6xl"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[2.25rem] font-semibold text-[var(--app-text-primary)] tracking-tight leading-tight">
            Design System
          </h1>
          <p className="text-[var(--app-text-secondary)] mt-1">
            Aurora Glass — DNA 360 primitives in every state
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={toggleTheme}
          icon={resolvedTheme === 'dark' ? <span>☀️</span> : <span>🌙</span>}
        >
          {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>
      </motion.div>

      {/* ─── COLOURS ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Colour palette">
          <GlassCard>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Swatch name="BG Base" value={resolvedTheme === 'dark' ? '#0B0E14' : '#F7F8FB'} />
              <Swatch name="BG Elevated" value={resolvedTheme === 'dark' ? '#11151F' : '#FFFFFF'} />
              <Swatch name="Aurora 1" value="#4F7DF3" />
              <Swatch name="Aurora 2" value="#6E56CF" />
              <Swatch name="Aurora 3" value="#2DD4BF" />
              <Swatch name="Success" value="#34D399" />
              <Swatch name="Warning" value="#FBBF24" />
              <Swatch name="Danger" value="#F87171" />
              <Swatch name="Info" value="#60A5FA" />
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--app-glass-border)]">
              <p className="text-sm font-medium text-[var(--app-text-primary)] mb-2">Text hierarchy</p>
              <div className="space-y-1">
                <p className="text-[var(--app-text-primary)]">Primary text — highest contrast</p>
                <p className="text-[var(--app-text-secondary)]">Secondary text — supporting content</p>
                <p className="text-[var(--app-text-muted)]">Muted text — captions and labels</p>
              </div>
            </div>
          </GlassCard>
        </Section>
      </motion.div>

      {/* ─── TYPOGRAPHY ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Typography">
          <GlassCard>
            <div className="space-y-4">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Eyebrow label · 0.6875rem</p>
              <p className="text-xs text-[var(--app-text-secondary)]">Caption text · 0.75rem</p>
              <p className="text-[0.8125rem] text-[var(--app-text-secondary)]">Small body · 0.8125rem</p>
              <p className="text-sm text-[var(--app-text-primary)]">Body text · 0.875rem</p>
              <p className="text-base text-[var(--app-text-primary)]">Base · 1rem</p>
              <p className="text-lg text-[var(--app-text-primary)] font-medium">Large · 1.125rem</p>
              <p className="font-display text-[1.375rem] text-[var(--app-text-primary)] font-semibold tracking-tight">Display sm · 1.375rem</p>
              <p className="font-display text-[1.75rem] text-[var(--app-text-primary)] font-semibold tracking-tight">Display md · 1.75rem</p>
              <p className="font-display text-[2.25rem] text-[var(--app-text-primary)] font-semibold tracking-tight">Display lg · 2.25rem</p>
              <p className="font-display text-[3rem] text-[var(--app-text-primary)] font-semibold tracking-tight leading-none">Display xl · 3rem</p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--app-glass-border)]">
              <p className="text-sm font-medium text-[var(--app-text-primary)] mb-2">Tabular numerals</p>
              <div className="tabular-nums text-2xl font-display font-semibold text-[var(--app-text-primary)] tracking-tight space-x-4">
                <span>₹1,23,456</span>
                <span>₹98,765</span>
                <span>₹4,321</span>
              </div>
            </div>
          </GlassCard>
        </Section>
      </motion.div>

      {/* ─── GLASS SURFACES ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Glass surfaces">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard>
              <p className="text-sm font-medium text-[var(--app-text-primary)]">Default glass card</p>
              <p className="text-sm text-[var(--app-text-muted)] mt-1">border-radius: 16px</p>
            </GlassCard>
            <GlassCard className="hover:border-white/20 hover:scale-[1.01] transition-all">
              <p className="text-sm font-medium text-[var(--app-text-primary)]">Hover card</p>
              <p className="text-sm text-[var(--app-text-muted)] mt-1">Lifts 2px, border brightens</p>
            </GlassCard>
            <GlassCard>
              <p className="text-sm font-semibold text-[var(--app-text-primary)] mb-1">With header</p>
              <p className="text-sm text-[var(--app-text-secondary)]">Card with header and footer slots.</p>
              <p className="text-xs text-[var(--app-text-muted)] mt-2 pt-2 border-t border-[var(--line)]">Card footer</p>
            </GlassCard>
          </div>
        </Section>
      </motion.div>

      {/* ─── STAT CARDS ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Stat cards">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active members"
              value={1247}
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              label="Revenue (MTD)"
              value="₹18.23L"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatCard
              label="Outstanding dues"
              value="₹4.56L"
              icon={<CreditCard className="w-5 h-5" />}
            />
            <StatCard
              label="Attendance today"
              value={89}
              icon={<Activity className="w-5 h-5" />}
            />
          </div>
        </Section>
      </motion.div>

      {/* ─── BUTTONS ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Buttons">
          <GlassCard>
            <div className="space-y-6">
              {/* Variants */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-3">Variants</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </div>
              {/* Sizes */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-3">Sizes</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              {/* States */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-3">States</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button icon={<Download className="w-4 h-4" />}>With icon</Button>
                  <Button loading onClick={() => { setBtnLoading(true); setTimeout(() => setBtnLoading(false), 2000) }}>
                    {btnLoading ? 'Saving…' : 'Loading'}
                  </Button>
                  <Button disabled>Disabled</Button>
                  <Button variant="danger" icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </Section>
      </motion.div>

      {/* ─── INPUTS ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Inputs">
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Default" placeholder="Enter text…" />
              <Input label="With icon" placeholder="Search…" icon={<Search className="w-4 h-4" />} />
              <Input label="Email" type="email" placeholder="name@gym.com" icon={<Mail className="w-4 h-4" />} hint="We'll never share your email." />
              <Input label="Password" type="password" placeholder="••••••••" icon={<Lock className="w-4 h-4" />} />
              <Input label="Error state" placeholder="Invalid value" error="This field is required" />
              <Input label="Disabled" placeholder="Can't touch this" disabled />
            </div>
          </GlassCard>
        </Section>
      </motion.div>

      {/* ─── SELECT & DATE PICKER ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Select & Date picker">
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger label="Plan type">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="pt">PT Package</SelectItem>
                </SelectContent>
              </Select>

              <DatePicker
                label="Start date"
                value={dateValue}
                onChange={setDateValue}
                placeholder="Pick a date"
              />
            </div>
          </GlassCard>
        </Section>
      </motion.div>

      {/* ─── BADGES ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Badges & Status pills">
          <GlassCard>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-3">Ghost (default)</p>
                <div className="flex flex-wrap gap-2">
                  <Badge status="success">Active</Badge>
                  <Badge status="warning">Expiring</Badge>
                  <Badge status="danger">Expired</Badge>
                  <Badge status="info">Frozen</Badge>
                  <Badge status="neutral">Draft</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-3">Filled / Solid</p>
                <div className="flex flex-wrap gap-2">
                  <Badge status="success" variant="solid">Active</Badge>
                  <Badge status="warning" variant="solid">Expiring</Badge>
                  <Badge status="danger" variant="solid">Expired</Badge>
                  <Badge status="info" variant="solid">Frozen</Badge>
                  <Badge status="neutral" variant="solid">Draft</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-3">Status pills with dot</p>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status="success" dot>Active</StatusPill>
                  <StatusPill status="warning" dot>Expiring soon</StatusPill>
                  <StatusPill status="danger" dot>Overdue</StatusPill>
                  <StatusPill status="info" dot>Paused</StatusPill>
                </div>
              </div>
            </div>
          </GlassCard>
        </Section>
      </motion.div>

      {/* ─── TABS ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Tabs">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <GlassCard><p className="text-sm text-[var(--app-text-secondary)]">Overview tab content. Tabs use Radix primitives with aurora-tinted active state.</p></GlassCard>
            </TabsContent>
            <TabsContent value="members">
              <GlassCard><p className="text-sm text-[var(--app-text-secondary)]">Members list would appear here.</p></GlassCard>
            </TabsContent>
            <TabsContent value="billing">
              <GlassCard><p className="text-sm text-[var(--app-text-secondary)]">Billing and invoices content.</p></GlassCard>
            </TabsContent>
            <TabsContent value="settings">
              <GlassCard><p className="text-sm text-[var(--app-text-secondary)]">Settings panel content.</p></GlassCard>
            </TabsContent>
          </Tabs>
        </Section>
      </motion.div>

      {/* ─── DATA TABLE ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Data table">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant={tableState === 'success' ? 'primary' : 'secondary'} size="sm" onClick={() => setTableState('success')}>Data</Button>
              <Button variant={tableState === 'loading' ? 'primary' : 'secondary'} size="sm" onClick={() => setTableState('loading')}>Loading</Button>
              <Button variant={tableState === 'empty' ? 'primary' : 'secondary'} size="sm" onClick={() => setTableState('empty')}>Empty</Button>
              <Button variant={tableState === 'error' ? 'primary' : 'secondary'} size="sm" onClick={() => setTableState('error')}>Error</Button>
            </div>

            <DataTable<MockMember>
              columns={mockColumns}
              data={tableState === 'success' ? mockMembers : []}
              status={tableState}
              sort={tableSort}
              onSort={handleSort}
              page={tablePage}
              pageSize={3}
              total={tableState === 'success' ? mockMembers.length : 0}
              onPageChange={setTablePage}
              getRowId={(row) => row.id}
              emptyTitle="No members yet"
              emptyDescription="Add your first member to get started."
              emptyAction={{ label: 'Add member', onClick: () => {} }}
              onRetry={() => setTableState('success')}
            />
          </div>
        </Section>
      </motion.div>

      {/* ─── MODALS & DRAWERS ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Modal & Drawer">
          <GlassCard>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
              <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open drawer</Button>
              <Button variant="secondary" onClick={() => setConfirmOpen(true)}>Confirm dialog</Button>
              <Button variant="danger" onClick={() => setConfirmDangerOpen(true)}>Danger confirm</Button>
            </div>
          </GlassCard>

          <Modal open={modalOpen} onOpenChange={setModalOpen} title="Edit member" description="Update member details below.">
            <div className="space-y-4">
              <Input label="Full name" placeholder="Arjun Mehta" />
              <Input label="Email" type="email" placeholder="arjun@mail.com" />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => { setModalOpen(false); toast.success('Member updated') }}>Save changes</Button>
              </div>
            </div>
          </Modal>

          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Member details" description="Full profile view">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--aurora-1)] to-[var(--aurora-3)] flex items-center justify-center text-white font-semibold">AM</div>
                <div>
                  <p className="font-medium text-[var(--app-text-primary)]">Arjun Mehta</p>
                  <p className="text-sm text-[var(--app-text-muted)]">Annual Premium · Active</p>
                </div>
              </div>
              <GlassCard padding="sm">
                <p className="text-sm text-[var(--app-text-secondary)]">Member since 15 Jan 2025</p>
              </GlassCard>
              <GlassCard padding="sm">
                <p className="text-sm text-[var(--app-text-secondary)]">Balance: ₹0 — Fully paid</p>
              </GlassCard>
            </div>
          </Drawer>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Confirm action"
            description="Are you sure you want to proceed? This action can be undone later."
            onConfirm={() => { setConfirmOpen(false); toast.success('Action confirmed') }}
          />

          <ConfirmDialog
            open={confirmDangerOpen}
            onOpenChange={setConfirmDangerOpen}
            title="Delete member"
            description="This will permanently remove this member's access. Their data will be retained for audit purposes."
            variant="danger"
            confirmLabel="Delete"
            onConfirm={() => { setConfirmDangerOpen(false); toast.error('Member deleted') }}
          />
        </Section>
      </motion.div>

      {/* ─── TOASTS ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Toasts">
          <GlassCard>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="sm" onClick={() => toast.success('Payment received', { description: '₹12,500 from Arjun Mehta' })}>
                Success toast
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.error('Payment failed', { description: 'Gateway returned error 502' })}>
                Error toast
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.warning('Membership expiring', { description: '3 days remaining' })}>
                Warning toast
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.info('Sync complete', { description: '42 records updated' })}>
                Info toast
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast('Default notification', { description: 'No specific status' })}>
                Default toast
              </Button>
            </div>
          </GlassCard>
        </Section>
      </motion.div>

      {/* ─── SKELETONS ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Skeleton loaders">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <GlassCard className="mt-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center gap-3 pt-2">
                <Skeleton variant="circular" className="w-10 h-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          </GlassCard>
        </Section>
      </motion.div>

      {/* ─── EMPTY STATE ─── */}
      <motion.div variants={staggerItem}>
        <Section title="Empty state">
          <EmptyState
            title="No invoices yet"
            description="Invoices will appear here once you start billing members."
            action={{ label: 'Create invoice', onClick: () => toast.info('Invoice creation coming soon') }}
          />
        </Section>
      </motion.div>

      {/* ─── FOOTER ─── */}
      <motion.div variants={staggerItem} className="py-8 text-center">
        <p className="text-xs text-[var(--app-text-muted)]">
          DNA 360 · Aurora Glass Design System · Built by Pinnacle Studios
        </p>
      </motion.div>
    </motion.div>
  )
}
