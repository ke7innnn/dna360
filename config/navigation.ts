/* ============================================================
   DNA 360 — Role-Based Navigation Configuration
   
   Mapped across system roles (Owner, Manager, Sales, Trainer,
   Front Desk, Staff No Login, Member).
   ============================================================ */

import type { NavGroup, RoleName } from '@/types'

export const navigationByRole: Record<RoleName, NavGroup[]> = {
  // ─── MEMBER ───
  member: [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
        { id: 'my-plan', label: 'My Plan', icon: 'CreditCard', href: '/my-plan' },
        { id: 'classes', label: 'Classes', icon: 'Calendar', href: '/classes' },
        { id: 'attendance', label: 'Attendance', icon: 'CheckCircle', href: '/attendance' },
        { id: 'profile', label: 'Profile', icon: 'User', href: '/profile' },
        { id: 'support', label: 'Support', icon: 'HelpCircle', href: '/support' },
      ],
    },
  ],

  // ─── FITNESS CONSULTANTS (SALES & DESK FLOOR) ───
  sales: [
    {
      label: 'Operations',
      items: [
        { id: 'front-desk', label: 'Front Desk POS', icon: 'Monitor', href: '/front-desk', requiredCapability: 'front_desk.access' },
        { id: 'members', label: 'Members', icon: 'Users', href: '/members', requiredCapability: 'members.view' },
        { id: 'products', label: 'Product Catalogue', icon: 'ShoppingBag', href: '/products', requiredCapability: 'products.view' },
        { id: 'classes', label: 'Classes', icon: 'Calendar', href: '/classes', requiredCapability: 'classes.view' },
        { id: 'attendance', label: 'Attendance', icon: 'CheckCircle', href: '/attendance', requiredCapability: 'attendance.view' },
      ],
    },
    {
      label: 'Sales Pipeline',
      items: [
        { id: 'leads', label: 'Leads & CRM', icon: 'Target', href: '/leads', requiredCapability: 'leads.view' },
        { id: 'plans', label: 'Invoicing & Plans', icon: 'Receipt', href: '/plans', requiredCapability: 'billing.view' },
        { id: 'consent', label: 'Consent Forms', icon: 'FileCheck', href: '/consent', requiredCapability: 'consent.view' },
      ],
    },
  ],

  // ─── FRONT DESK / SUPERVISOR / MASSEUR ───
  front_desk: [
    {
      label: 'Operations',
      items: [
        { id: 'front-desk', label: 'Front Desk Console', icon: 'Monitor', href: '/front-desk', requiredCapability: 'front_desk.access' },
        { id: 'members', label: 'Members', icon: 'Users', href: '/members', requiredCapability: 'members.view' },
        { id: 'classes', label: 'Classes', icon: 'Calendar', href: '/classes', requiredCapability: 'classes.view' },
        { id: 'attendance', label: 'Attendance', icon: 'CheckCircle', href: '/attendance', requiredCapability: 'attendance.view' },
      ],
    },
    {
      label: 'Desk Sales',
      items: [
        { id: 'leads', label: 'Walk-in Inquiries', icon: 'Target', href: '/leads', requiredCapability: 'leads.view' },
        { id: 'products', label: 'Product Catalogue', icon: 'ShoppingBag', href: '/products', requiredCapability: 'products.view' },
      ],
    },
  ],

  // ─── TRAINER ───
  trainer: [
    {
      label: 'Coaching',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
        { id: 'my-clients', label: 'My Clients', icon: 'Users', href: '/my-clients', requiredCapability: 'trainer.clients' },
        { id: 'schedule', label: 'PT Schedule', icon: 'Calendar', href: '/schedule', requiredCapability: 'trainer.schedule' },
        { id: 'classes', label: 'Class Timetable', icon: 'Dumbbell', href: '/classes', requiredCapability: 'classes.view' },
        { id: 'consent', label: 'PT E-Signing', icon: 'FileCheck', href: '/consent', requiredCapability: 'consent.view' },
      ],
    },
  ],

  // ─── MANAGEMENT (HR / MARKETING / ASST SALES HEAD) ───
  manager: [
    {
      label: 'Overview',
      items: [
        { id: 'overview', label: 'Executive Overview', icon: 'BarChart3', href: '/overview', requiredCapability: 'analytics.view' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'members', label: 'Members Directory', icon: 'Users', href: '/members', requiredCapability: 'members.view' },
        { id: 'products', label: 'Product Catalogue', icon: 'ShoppingBag', href: '/products', requiredCapability: 'products.view' },
        { id: 'plans', label: 'Invoices & Billing', icon: 'Receipt', href: '/plans', requiredCapability: 'billing.view' },
        { id: 'classes', label: 'Timetable & Studios', icon: 'Calendar', href: '/classes', requiredCapability: 'classes.view' },
        { id: 'staff', label: 'Staff Roster & HR', icon: 'UserCog', href: '/staff', requiredCapability: 'staff.view' },
        { id: 'attendance', label: 'Turnstile & Access', icon: 'CheckCircle', href: '/attendance', requiredCapability: 'attendance.view' },
        { id: 'consent', label: 'Agreements & T&C', icon: 'FileCheck', href: '/consent', requiredCapability: 'consent.view' },
      ],
    },
    {
      label: 'Growth',
      items: [
        { id: 'analytics', label: 'Analytics & Revenue', icon: 'TrendingUp', href: '/analytics', requiredCapability: 'analytics.view' },
        { id: 'leads', label: 'Leads & CRM', icon: 'Target', href: '/leads', requiredCapability: 'leads.view' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { id: 'settings', label: 'Club Settings', icon: 'Settings', href: '/settings', requiredCapability: 'settings.view' },
        { id: 'audit-log', label: 'Audit Log', icon: 'FileText', href: '/audit-log', requiredCapability: 'audit.view' },
      ],
    },
  ],

  // ─── OWNER / EXECUTIVE ───
  owner: [
    {
      label: 'Overview',
      items: [
        { id: 'overview', label: 'Overview', icon: 'BarChart3', href: '/overview' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'members', label: 'Members', icon: 'Users', href: '/members' },
        { id: 'products', label: 'Product Catalogue', icon: 'ShoppingBag', href: '/products' },
        { id: 'plans', label: 'Invoices & Billing', icon: 'Receipt', href: '/plans' },
        { id: 'classes', label: 'Classes & Timetable', icon: 'Calendar', href: '/classes' },
        { id: 'staff', label: 'Staff Management', icon: 'UserCog', href: '/staff' },
        { id: 'attendance', label: 'Attendance & Access', icon: 'CheckCircle', href: '/attendance' },
        { id: 'consent', label: 'Agreements & T&C', icon: 'FileCheck', href: '/consent' },
      ],
    },
    {
      label: 'Growth',
      items: [
        { id: 'analytics', label: 'Analytics & GST', icon: 'TrendingUp', href: '/analytics' },
        { id: 'leads', label: 'Leads & CRM', icon: 'Target', href: '/leads' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { id: 'settings', label: 'Club Settings', icon: 'Settings', href: '/settings' },
        { id: 'audit-log', label: 'Audit Trail', icon: 'FileText', href: '/audit-log' },
      ],
    },
  ],

  // ─── ATTENDANCE ONLY ───
  staff_no_login: [],
}
