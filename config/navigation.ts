/* ============================================================
   DNA 360 — Navigation Configuration (RBAC)
   Single-club v1 · Powai

   Filters navigation items dynamically by user capabilities.
   Eliminates duplicate & dead paths across all roles.
   ============================================================ */

import type { NavGroup, RoleName } from '@/types'
import type { Capability } from '@/config/permissions'

export interface AppNavItem {
  id: string
  label: string
  icon: string
  href: string
  badge?: number
  requiredCapability?: Capability
  revenueGated?: boolean
  staffOnly?: boolean
}

export interface AppNavGroup {
  label?: string
  items: AppNavItem[]
}

export const ALL_NAV_GROUPS: AppNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'overview', label: 'Overview', icon: 'BarChart3', href: '/overview', staffOnly: true },
      { id: 'dashboard', label: 'Member Portal', icon: 'LayoutDashboard', href: '/dashboard', requiredCapability: 'portal.access' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'members', label: 'Member Directory', icon: 'Users', href: '/members', badge: 659, requiredCapability: 'members.view.all' },
      { id: 'front-desk', label: 'Front Desk Terminal', icon: 'Monitor', href: '/front-desk', requiredCapability: 'checkin.operate' },
      { id: 'products', label: 'Product Catalogue', icon: 'CreditCard', href: '/products', requiredCapability: 'products.view' },
      { id: 'billing', label: 'Invoices & Billing', icon: 'Receipt', href: '/billing', requiredCapability: 'billing.view' },
      { id: 'classes', label: 'Classes & Timetable', icon: 'Calendar', href: '/classes', requiredCapability: 'classes.manage.all' },
      { id: 'staff', label: 'Staff Roster & Roles', icon: 'UserCog', href: '/settings/roles', requiredCapability: 'staff.view' },
      { id: 'attendance', label: 'Turnstile Attendance', icon: 'CheckCircle', href: '/attendance', requiredCapability: 'checkin.view' },
      { id: 'consent', label: 'Agreements & T&C', icon: 'FileText', href: '/consent', requiredCapability: 'members.view.all' },
    ],
  },
  {
    label: 'Growth & Finance',
    items: [
      { id: 'analytics', label: 'Financial Analytics & GST', icon: 'TrendingUp', href: '/analytics', requiredCapability: 'revenue.view', revenueGated: true },
      { id: 'leads', label: 'Leads & CRM Pipeline', icon: 'Target', href: '/leads', requiredCapability: 'leads.manage' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'settings', label: 'Club Settings', icon: 'Settings', href: '/settings', requiredCapability: 'settings.manage' },
      { id: 'audit', label: 'Audit Trail', icon: 'FileText', href: '/audit-log', requiredCapability: 'audit.view' },
    ],
  },
]
