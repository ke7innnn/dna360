/* ============================================================
   DNA 360 — Navigation Configuration (RBAC)
   Single-club v1 · Powai

   Filters navigation items dynamically by user capabilities.
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
      { id: 'members', label: 'Members', icon: 'Users', href: '/members', badge: 659, requiredCapability: 'members.view.all' },
      { id: 'my-clients', label: 'My Assigned Clients', icon: 'Users', href: '/members', requiredCapability: 'members.view.own' },
      { id: 'products', label: 'Product Catalogue', icon: 'CreditCard', href: '/products', requiredCapability: 'products.view' },
      { id: 'billing', label: 'Invoices & Billing', icon: 'Receipt', href: '/billing', requiredCapability: 'billing.view' },
      { id: 'classes', label: 'Classes & Timetable', icon: 'Calendar', href: '/classes', requiredCapability: 'classes.manage.all' },
      { id: 'my-classes', label: 'My Sessions', icon: 'Calendar', href: '/classes', requiredCapability: 'classes.manage.own' },
      { id: 'staff', label: 'Staff Management', icon: 'UserCog', href: '/settings/roles', requiredCapability: 'staff.view' },
      { id: 'attendance', label: 'Attendance & Access', icon: 'CheckCircle', href: '/attendance', requiredCapability: 'checkin.view' },
      { id: 'consent', label: 'Agreements & T&C', icon: 'FileText', href: '/consent', requiredCapability: 'members.view.all' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { id: 'analytics', label: 'Analytics & GST', icon: 'TrendingUp', href: '/overview', requiredCapability: 'revenue.view', revenueGated: true },
      { id: 'leads', label: 'Leads & CRM', icon: 'Target', href: '/leads', requiredCapability: 'leads.manage' },
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

// Fallback role definitions for static fallback
export const navigationByRole: Record<string, NavGroup[]> = {
  member: [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
        { id: 'classes', label: 'Classes', icon: 'Calendar', href: '/classes' },
        { id: 'attendance', label: 'Attendance', icon: 'CheckCircle', href: '/attendance' },
        { id: 'profile', label: 'Profile', icon: 'User', href: '/profile' },
      ],
    },
  ],
  owner: ALL_NAV_GROUPS as NavGroup[],
  manager: ALL_NAV_GROUPS as NavGroup[],
  sales: ALL_NAV_GROUPS as NavGroup[],
  trainer: ALL_NAV_GROUPS as NavGroup[],
  front_desk: ALL_NAV_GROUPS as NavGroup[],
  staff_no_login: ALL_NAV_GROUPS as NavGroup[],
}
