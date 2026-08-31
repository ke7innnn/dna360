/**
 * DNA 360 — Daily Action Queue Engine
 *
 * Replaces passive alerts with an actionable, prioritized daily work queue
 * for front desk, sales consultants, and head trainers.
 */

import { getStoredMembers } from '@/lib/members'
import { getStoredLeads } from '@/lib/leads'
import { logAuditEvent } from '@/lib/audit'

export type ActionQueueCategory = 'RENEWAL' | 'GRACE_RECOVERY' | 'PT_BURNDOWN' | 'LEAD_OUTREACH'
export type ActionQueueStatus = 'pending' | 'done' | 'snoozed'

export interface ActionQueueItem {
  id: string
  category: ActionQueueCategory
  title: string
  description: string
  memberId?: string
  memberName: string
  phone: string
  assignedTo: string
  assignedRole: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  status: ActionQueueStatus
  dueDate: string
  dueCountdown: string
  ltvMinor?: number
  planName?: string
  expiryDate?: string
  sessionsLeft?: number
  completedAt?: string
  completedBy?: string
}

const ACTION_QUEUE_STORAGE_KEY = 'dna360_daily_action_queue_v2'

export function generateDailyActionQueue(): ActionQueueItem[] {
  const members = getStoredMembers()
  const leads = getStoredLeads()

  const queue: ActionQueueItem[] = []

  // 1. Grace Period Critical Items (Top Priority)
  const graceMembers = members.filter((m) => m.status === 'grace_period').slice(0, 4)
  graceMembers.forEach((m, idx) => {
    queue.push({
      id: `act_grace_${m.id}`,
      category: 'GRACE_RECOVERY',
      title: `Grace Period Dues: ${m.name}`,
      description: `Plan expired ${idx + 2} days ago. In 7-day grace window · Call to settle dues before turnstile lockout.`,
      memberId: m.id,
      memberName: m.name,
      phone: m.phone,
      assignedTo: 'Amit Sharma',
      assignedRole: 'Fitness Consultant',
      priority: 'CRITICAL',
      status: 'pending',
      dueDate: '2026-08-31',
      dueCountdown: `${5 - idx} days left in grace`,
      ltvMinor: m.lifetime_value,
      planName: m.active_memberships[0]?.product_name || 'Annual Gym',
      expiryDate: m.active_memberships[0]?.expiry_date,
    })
  })

  // 2. Renewals Due in 7 Days (Sorted by Highest LTV)
  const expiringMembers = members
    .filter((m) => m.status === 'expiring_soon')
    .sort((a, b) => (b.lifetime_value || 0) - (a.lifetime_value || 0))
    .slice(0, 5)

  expiringMembers.forEach((m, idx) => {
    queue.push({
      id: `act_renew_${m.id}`,
      category: 'RENEWAL',
      title: `High-Value Renewal: ${m.name}`,
      description: `${m.active_memberships[0]?.product_name || 'Annual Plan'} expires in ${idx + 2} days · LTV ₹${((m.lifetime_value || 0) / 100).toLocaleString()}`,
      memberId: m.id,
      memberName: m.name,
      phone: m.phone,
      assignedTo: idx % 2 === 0 ? 'Amit Sharma' : 'Keith Fernandes',
      assignedRole: 'Sales Head',
      priority: 'HIGH',
      status: 'pending',
      dueDate: '2026-09-02',
      dueCountdown: `in ${idx + 2} days`,
      ltvMinor: m.lifetime_value,
      planName: m.active_memberships[0]?.product_name,
      expiryDate: m.active_memberships[0]?.expiry_date,
    })
  })

  // 3. PT Pack Burn-Down Upsell (Sessions <= 2 remaining)
  const ptMembers = members
    .filter((m) => {
      const ms = m.active_memberships[0]
      return ms && ms.sessions_total && ms.sessions_remaining !== null && ms.sessions_remaining <= 3
    })
    .slice(0, 3)

  ptMembers.forEach((m) => {
    const ms = m.active_memberships[0]
    queue.push({
      id: `act_pt_${m.id}`,
      category: 'PT_BURNDOWN',
      title: `PT Pack Top-Up: ${m.name}`,
      description: `Only ${ms.sessions_remaining} sessions left of ${ms.sessions_total} total · Pitch renewal pack with Coach ${m.assigned_trainer_name || 'Rajesh'}`,
      memberId: m.id,
      memberName: m.name,
      phone: m.phone,
      assignedTo: m.assigned_trainer_name || 'Rajesh Poojary',
      assignedRole: 'Head Trainer',
      priority: 'HIGH',
      status: 'pending',
      dueDate: '2026-09-01',
      dueCountdown: `${ms.sessions_remaining} sessions left`,
      planName: ms.product_name,
      sessionsLeft: ms.sessions_remaining || 1,
    })
  })

  // 4. New Uncontacted Leads
  const uncontactedLeads = leads.filter((l) => l.stage === 'inquiry').slice(0, 3)
  uncontactedLeads.forEach((l) => {
    queue.push({
      id: `act_lead_${l.id}`,
      category: 'LEAD_OUTREACH',
      title: `Trial Inquiry: ${l.name}`,
      description: `Inquiry via ${l.source} (${l.planInterest || 'Gym Floor'}) · Schedule 1-on-1 club walkthrough`,
      memberName: l.name,
      phone: l.phone,
      assignedTo: 'Amit Sharma',
      assignedRole: 'Fitness Consultant',
      priority: 'MEDIUM',
      status: 'pending',
      dueDate: '2026-08-31',
      dueCountdown: 'Today',
      planName: l.planInterest || 'General Membership',
    })
  })

  return queue
}

export function getActionQueue(): ActionQueueItem[] {
  if (typeof window === 'undefined') return generateDailyActionQueue()

  const stored = localStorage.getItem(ACTION_QUEUE_STORAGE_KEY)
  if (!stored) {
    const initial = generateDailyActionQueue()
    localStorage.setItem(ACTION_QUEUE_STORAGE_KEY, JSON.stringify(initial))
    return initial
  }

  try {
    return JSON.parse(stored)
  } catch {
    return generateDailyActionQueue()
  }
}

export function updateActionQueueItem(
  itemId: string,
  newStatus: ActionQueueStatus,
  actorName: string
): ActionQueueItem[] {
  const current = getActionQueue()
  const updated = current.map((item) =>
    item.id === itemId
      ? {
          ...item,
          status: newStatus,
          completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
          completedBy: newStatus === 'done' ? actorName : undefined,
        }
      : item
  )

  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTION_QUEUE_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('dna360_action_queue_updated'))
  }

  logAuditEvent({
    actor: { id: 'usr_staff', name: actorName, email: '', role: 'Staff' },
    action: 'STATUS_CHANGE',
    entity: 'ActionQueueItem',
    entityId: itemId,
    branchId: 'pow',
    description: `${actorName} marked action item '${itemId}' as ${newStatus.toUpperCase()}`,
  })

  return updated
}
