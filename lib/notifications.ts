/* ============================================================
   DNA 360 — Notification System
   
   Outbound queue with provider adapter pattern.
   
   Channel reality (from the data):
   - 679/679 have mobile (100%) → SMS is viable
   - 48/679 have email (7%) → email is NOT viable
   - 0/679 have WhatsApp consent → must be captured fresh
   
   In-app notifications work from day one.
   WhatsApp adapter ships stubbed and disabled.
   ============================================================ */

import { logAuditEvent } from '@/lib/audit'

const NOTIFICATIONS_KEY = 'dna360_notifications'
const QUEUE_KEY = 'dna360_notification_queue'

// ─── Types ───

export type NotificationChannel = 'in_app' | 'sms' | 'whatsapp' | 'email'
export type NotificationPriority = 'high' | 'normal' | 'low'
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'queued'

export type NotificationType =
  | 'membership_expiry_7d'
  | 'membership_expiry_15d'
  | 'membership_expiry_30d'
  | 'entitlement_expiry'
  | 'invoice_generated'
  | 'payment_received'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'waitlist_promoted'
  | 'check_in'
  | 'grace_period_warning'
  | 'follow_up_reminder'
  | 'consent_required'
  | 'custom'

export interface Notification {
  id: string
  type: NotificationType
  channel: NotificationChannel
  recipientId: string
  recipientName: string
  recipientPhone: string
  recipientEmail?: string | null
  title: string
  body: string
  priority: NotificationPriority
  status: NotificationStatus
  /** PDF attachment path (invoices, receipts) */
  attachmentPath?: string
  createdAt: string
  sentAt?: string
  deliveredAt?: string
  failureReason?: string
  /** Retry count */
  retryCount: number
  maxRetries: number
}

// ─── In-App Notifications (working from day one) ───

export interface InAppNotification {
  id: string
  userId: string
  title: string
  body: string
  type: NotificationType
  read: boolean
  createdAt: string
  link?: string
}

export function getInAppNotifications(userId?: string): InAppNotification[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(NOTIFICATIONS_KEY)
  if (!stored) return []
  try {
    const all: InAppNotification[] = JSON.parse(stored)
    if (!userId || userId === 'all') {
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return all
      .filter(n => n.userId === userId || n.userId === 'all' || n.userId === 'usr_admin')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch { return [] }
}

export function createInAppNotification(
  userId: string,
  notification: Omit<InAppNotification, 'id' | 'userId' | 'read' | 'createdAt'>
): InAppNotification {
  const newNotif: InAppNotification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    read: false,
    createdAt: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY)
    const all: InAppNotification[] = stored ? JSON.parse(stored) : []
    all.unshift(newNotif)
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all.slice(0, 1000)))
    window.dispatchEvent(new Event('dna360_notifications_updated'))
  }

  return newNotif
}

export function markNotificationRead(notifId: string) {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem(NOTIFICATIONS_KEY)
  if (!stored) return
  const all: InAppNotification[] = JSON.parse(stored)
  const index = all.findIndex(n => n.id === notifId)
  if (index !== -1) {
    all[index].read = true
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all))
    window.dispatchEvent(new Event('dna360_notifications_updated'))
  }
}

export function markAllNotificationsRead(userId?: string) {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem(NOTIFICATIONS_KEY)
  if (!stored) return
  const all: InAppNotification[] = JSON.parse(stored)
  const updated = all.map(n => {
    if (!userId || userId === 'all' || n.userId === userId || n.userId === 'all') {
      return { ...n, read: true }
    }
    return n
  })
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated))
  window.dispatchEvent(new Event('dna360_notifications_updated'))
}

export function getUnreadCount(userId?: string): number {
  return getInAppNotifications(userId).filter(n => !n.read).length
}

// ─── Outbound Queue (SMS, WhatsApp, Email adapters) ───

export function getNotificationQueue(): Notification[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(QUEUE_KEY)
  if (!stored) return []
  try { return JSON.parse(stored) } catch { return [] }
}

function saveQueue(queue: Notification[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

/**
 * Queue a notification for delivery.
 * In-app notifications are delivered immediately.
 * SMS/WhatsApp/Email are queued for the adapter to process.
 */
export function queueNotification(
  notification: Omit<Notification, 'id' | 'status' | 'createdAt' | 'retryCount'>
): Notification {
  const newNotif: Notification = {
    ...notification,
    id: `outbound_${Date.now()}`,
    status: notification.channel === 'in_app' ? 'delivered' : 'queued',
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }

  const queue = getNotificationQueue()
  queue.push(newNotif)
  saveQueue(queue)

  // If in-app, also create the in-app notification
  if (notification.channel === 'in_app') {
    createInAppNotification(notification.recipientId, {
      title: notification.title,
      body: notification.body,
      type: notification.type,
    })
  }

  return newNotif
}

// ─── Provider Adapter Interface ───

/**
 * SMS adapter interface.
 * Stubbed — DLT registration and sender ID are PENDING.
 */
export interface SmsAdapter {
  send(phone: string, message: string, dltTemplateId?: string): Promise<{ delivered: boolean; messageId: string }>
}

/**
 * WhatsApp BSP adapter interface.
 * Stubbed and disabled.
 * 
 * The client is still on the free WhatsApp Business app with:
 * - No API access
 * - No Business Manager verification
 * - No approved templates
 * 
 * WhatsApp consent must be captured fresh at first contact or renewal
 * before any broadcast.
 */
export interface WhatsAppAdapter {
  sendTemplate(phone: string, templateName: string, params: Record<string, string>): Promise<{ delivered: boolean; messageId: string }>
  sendDocument(phone: string, documentUrl: string, caption: string): Promise<{ delivered: boolean; messageId: string }>
}

/**
 * Email adapter interface.
 * Stubbed — only 7% of members have email addresses.
 * Not a viable primary channel.
 */
export interface EmailAdapter {
  send(to: string, subject: string, html: string, attachments?: { filename: string; path: string }[]): Promise<{ delivered: boolean; messageId: string }>
}

// ─── Stub implementations (for development) ───

export const stubSmsAdapter: SmsAdapter = {
  async send(phone, message) {
    console.log(`[SMS STUB] To: ${phone}, Message: ${message.slice(0, 50)}...`)
    return { delivered: false, messageId: `stub_sms_${Date.now()}` }
  },
}

export const stubWhatsAppAdapter: WhatsAppAdapter = {
  async sendTemplate(phone, templateName, params) {
    console.log(`[WhatsApp STUB] To: ${phone}, Template: ${templateName}`)
    return { delivered: false, messageId: `stub_wa_${Date.now()}` }
  },
  async sendDocument(phone, documentUrl, caption) {
    console.log(`[WhatsApp STUB] To: ${phone}, Doc: ${documentUrl}`)
    return { delivered: false, messageId: `stub_wa_${Date.now()}` }
  },
}

export const stubEmailAdapter: EmailAdapter = {
  async send(to, subject) {
    console.log(`[Email STUB] To: ${to}, Subject: ${subject}`)
    return { delivered: false, messageId: `stub_email_${Date.now()}` }
  },
}
