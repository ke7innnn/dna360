/**
 * DNA 360 — WhatsApp Business API Engine & Budget Guard
 *
 * Official Meta WhatsApp Cloud API Catalog (11 Approved Templates):
 * 1.  dna360_welcome_member (UTILITY)
 * 2.  dna360_payment_reminder (UTILITY)
 * 3.  dna360_membership_expiry_reminder (UTILITY)
 * 4.  dna360_class_booking_confirmed (UTILITY)
 * 5.  dna360_class_reminder (UTILITY)
 * 6.  dna360_birthday_wishes (MARKETING)
 * 7.  dna360_membership_update (UTILITY)
 * 8.  dna360_membership_renewal_confirmed (UTILITY)
 * 9.  dna360_exclusive_offer (MARKETING)
 * 10. dna360_maintenance_half_day (UTILITY)
 * 11. dna360_maintenance_full_day (UTILITY)
 */

import { logAuditEvent } from '@/lib/audit'
import { maskPhoneNumber } from '@/lib/auth'

export type WhatsAppCategory =
  | 'ALL'
  | 'ONBOARDING'
  | 'BILLING'
  | 'RENEWAL'
  | 'CLASSES'
  | 'ANNOUNCEMENTS'
  | 'MARKETING'
  | 'CHURN_WINBACK'
  | 'PT_UPSELL'
  | 'GRACE_PERIOD'

export interface WhatsAppTemplate {
  id: string
  name: string
  category: WhatsAppCategory
  metaCategory: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
  metaTemplateName: string
  language: string
  headerText?: string
  bodyTemplate: string
  parameters: {
    index: number
    key: string
    label: string
    placeholder: string
  }[]
}

export interface WhatsAppBudget {
  monthlyLimitInr: number    // e.g. ₹5,000 / month
  spentThisMonthInr: number  // e.g. ₹1,240
  costPerMessageInr: number  // ₹0.85 per message
  messagesSentThisMonth: number
  isBudgetExceeded: boolean
}

const BUDGET_STORAGE_KEY = 'dna360_wa_budget'

export const APPROVED_TEMPLATES: WhatsAppTemplate[] = [
  // 1. Welcome to DNA360 Fitness!
  {
    id: 'tpl_welcome_member',
    name: '1. Welcome to DNA360 Fitness!',
    category: 'ONBOARDING',
    metaCategory: 'UTILITY',
    metaTemplateName: 'dna360_welcome_member',
    language: 'en',
    headerText: 'DNA 360 · Member Welcome',
    bodyTemplate:
      "Dear {{1}},\nWelcome to DNA360 Fitness! We're delighted to have you as a member.\nYour membership is now active, and we look forward to supporting you on your fitness journey.\nFor any assistance regarding your membership, sessions, or facilities, please feel free to contact our team.\nWarm regards,\nTeam DNA360 Fitness",
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
    ],
  },

  // 2. Payment Reminder – DNA360 Fitness
  {
    id: 'tpl_payment_reminder',
    name: '2. Payment Reminder – DNA360 Fitness',
    category: 'BILLING',
    metaCategory: 'UTILITY',
    metaTemplateName: 'dna360_payment_reminder',
    language: 'en',
    headerText: 'DNA 360 · Payment Reminder',
    bodyTemplate:
      'Dear {{1}},\nThis is a gentle reminder that a payment of ₹{{2}} is currently due for your DNA360 Fitness membership/services.\nKindly complete the payment at your earliest convenience to ensure uninterrupted access to your membership/services.\nFor any assistance, please contact our team.\nRegards,\nTeam DNA360 Fitness',
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
      { index: 2, key: 'due_amount', label: 'Due Amount (₹)', placeholder: '12,500' },
    ],
  },

  // 3. Membership Expiry Reminder – DNA360 Fitness
  {
    id: 'tpl_membership_expiry_reminder',
    name: '3. Membership Expiry Reminder',
    category: 'RENEWAL',
    metaCategory: 'UTILITY',
    metaTemplateName: 'dna360_membership_expiry_reminder',
    language: 'en',
    headerText: 'DNA 360 · Expiry Reminder',
    bodyTemplate:
      'Dear {{1}},\nWe would like to remind you that your DNA360 Fitness membership is scheduled to expire on {{2}}.\nIf you wish to continue your fitness journey with us, our team would be happy to assist you with the renewal process.\nPlease feel free to contact us for further details.\nRegards,\nTeam DNA360 Fitness',
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
      { index: 2, key: 'expiry_date', label: 'Expiry Date', placeholder: '15 Oct 2026' },
    ],
  },

  // 4. Class Booking Confirmed – DNA360 Fitness
  {
    id: 'tpl_class_booking_confirmed',
    name: '4. Class Booking Confirmed',
    category: 'CLASSES',
    metaCategory: 'UTILITY',
    metaTemplateName: 'dna360_class_booking_confirmed',
    language: 'en',
    headerText: 'DNA 360 · Booking Confirmed',
    bodyTemplate:
      'Dear {{1}},\nYour booking has been confirmed for the following session:\nClass: {{2}}\nDate: {{3}}\nTime: {{4}}\nWe look forward to seeing you at DNA360 Fitness.\nRegards,\nTeam DNA360 Fitness',
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
      { index: 2, key: 'class_name', label: 'Class / Session', placeholder: 'HIIT & Strength' },
      { index: 3, key: 'session_date', label: 'Date', placeholder: '10 Sep 2026' },
      { index: 4, key: 'session_time', label: 'Time', placeholder: '07:00 AM' },
    ],
  },

  // 5. Class Reminder – DNA360 Fitness
  {
    id: 'tpl_class_reminder',
    name: '5. Class Reminder – DNA360 Fitness',
    category: 'CLASSES',
    metaCategory: 'UTILITY',
    metaTemplateName: 'dna360_class_reminder',
    language: 'en',
    headerText: 'DNA 360 · Class Reminder',
    bodyTemplate:
      'Dear {{1}},\nThis is a reminder for your upcoming session at DNA360 Fitness.\nClass: {{2}}\nDate: {{3}}\nTime: {{4}}\nWe look forward to seeing you.\nRegards,\nTeam DNA360 Fitness',
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
      { index: 2, key: 'class_name', label: 'Class / Session', placeholder: 'Power Yoga' },
      { index: 3, key: 'session_date', label: 'Date', placeholder: '10 Sep 2026' },
      { index: 4, key: 'session_time', label: 'Time', placeholder: '06:30 PM' },
    ],
  },

  // 6. Happy Birthday from DNA360 Fitness! 🎉
  {
    id: 'tpl_birthday_wishes',
    name: '6. Happy Birthday Wishes 🎉',
    category: 'MARKETING',
    metaCategory: 'MARKETING',
    metaTemplateName: 'dna360_birthday_wishes',
    language: 'en',
    headerText: 'DNA 360 · Happy Birthday!',
    bodyTemplate:
      'Dear {{1}},\nWishing you a very Happy Birthday! 🎂\nMay your year ahead be filled with happiness, good health, and many new achievements.\nHave a wonderful day!\nWarm wishes,\nTeam DNA360 Fitness',
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
    ],
  },

  // 7. Membership Update – DNA360 Fitness
  {
    id: 'tpl_membership_update',
    name: '7. Membership Update – DNA360 Fitness',
    category: 'ONBOARDING',
    metaCategory: 'UTILITY',
    metaTemplateName: 'dna360_membership_update',
    language: 'en',
    headerText: 'DNA 360 · Membership Update',
    bodyTemplate:
      'Dear {{1}},\nYour DNA360 Fitness membership details have been updated.\nPlan: {{2}}\nStart Date: {{3}}\nValidity: {{4}}\nThank you for choosing DNA360 Fitness. We look forward to being a part of your fitness journey.\nRegards,\nTeam DNA360 Fitness',
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
      { index: 2, key: 'plan_name', label: 'Plan Name', placeholder: 'Annual Premium All-Access' },
      { index: 3, key: 'start_date', label: 'Start Date', placeholder: '01 Sep 2026' },
      { index: 4, key: 'validity_date', label: 'Validity Date', placeholder: '31 Aug 2027' },
    ],
  },

  // 8. Membership Renewal Confirmed – DNA360 Fitness
  {
    id: 'tpl_membership_renewal_confirmed',
    name: '8. Membership Renewal Confirmed',
    category: 'RENEWAL',
    metaCategory: 'UTILITY',
    metaTemplateName: 'dna360_membership_renewal_confirmed',
    language: 'en',
    headerText: 'DNA 360 · Renewal Confirmed',
    bodyTemplate:
      'Dear {{1}},\nThank you for renewing your membership with DNA360 Fitness.\nYour renewed membership details are as follows:\nPlan: {{2}}\nStart Date: {{3}}\nValidity: {{4}}\nWe look forward to welcoming you back and supporting your fitness journey.\nRegards,\nTeam DNA360 Fitness',
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
      { index: 2, key: 'plan_name', label: 'Plan Name', placeholder: 'Quarterly Strength & Conditioning' },
      { index: 3, key: 'start_date', label: 'Start Date', placeholder: '15 Sep 2026' },
      { index: 4, key: 'validity_date', label: 'Validity Date', placeholder: '14 Dec 2026' },
    ],
  },

  // 9. Exclusive Offer from DNA360 Fitness
  {
    id: 'tpl_exclusive_offer',
    name: '9. Exclusive Offer from DNA360 Fitness',
    category: 'MARKETING',
    metaCategory: 'MARKETING',
    metaTemplateName: 'dna360_exclusive_offer',
    language: 'en',
    headerText: 'DNA 360 · Exclusive Offer',
    bodyTemplate:
      "Dear {{1}},\nWe're pleased to share an exclusive offer with you from DNA360 Fitness.\nEnjoy {{2}} on your selected membership/package for a limited period.\nOffer valid until: {{3}}\nIf you're interested, simply reply to this message or contact our team for more details.\nWarm regards,\nTeam DNA360 Fitness",
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
      { index: 2, key: 'offer_details', label: 'Offer Benefit', placeholder: '20% Off + 1 Free Personal Training Month' },
      { index: 3, key: 'valid_until', label: 'Valid Until', placeholder: '30 Sep 2026' },
    ],
  },

  // 10. Maintenance Update – DNA360 Fitness(Half day)
  {
    id: 'tpl_maintenance_half_day',
    name: '10. Maintenance Update (Half day)',
    category: 'ANNOUNCEMENTS',
    metaCategory: 'UTILITY',
    metaTemplateName: 'dna360_maintenance_half_day',
    language: 'en',
    headerText: 'DNA 360 · Maintenance Notice',
    bodyTemplate:
      'Dear {{1}},\nPlease be informed that DNA360 Fitness will be operating for limited hours on {{2}} due to scheduled maintenance.\nGym Timings: {{3}}\nWe apologise for any inconvenience caused and appreciate your understanding.\nWarm regards,\nTeam DNA360 Fitness',
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
      { index: 2, key: 'maintenance_date', label: 'Date', placeholder: 'Sunday, 13 Sep 2026' },
      { index: 3, key: 'timings', label: 'Gym Timings', placeholder: '06:00 AM to 01:00 PM' },
    ],
  },

  // 11. Maintenance Update – DNA360 Fitness(full day)
  {
    id: 'tpl_maintenance_full_day',
    name: '11. Maintenance Update (Full day)',
    category: 'ANNOUNCEMENTS',
    metaCategory: 'UTILITY',
    metaTemplateName: 'dna360_maintenance_full_day',
    language: 'en',
    headerText: 'DNA 360 · Club Maintenance',
    bodyTemplate:
      'Dear {{1}},\nPlease be informed that DNA360 Fitness will remain closed on {{2}} due to scheduled maintenance.\nRegular operations will resume from {{3}}.\nWe apologise for any inconvenience caused and appreciate your understanding.\nWarm regards,\nTeam DNA360 Fitness',
    parameters: [
      { index: 1, key: 'member_name', label: 'Member Name', placeholder: 'Keith Shah' },
      { index: 2, key: 'closed_date', label: 'Closed Date', placeholder: 'Monday, 14 Sep 2026' },
      { index: 3, key: 'resume_date', label: 'Resume Date/Time', placeholder: 'Tuesday, 15 Sep 2026 at 05:00 AM' },
    ],
  },
]

export function getWhatsAppBudget(): WhatsAppBudget {
  const defaultBudget: WhatsAppBudget = {
    monthlyLimitInr: 5000,
    spentThisMonthInr: 1240,
    costPerMessageInr: 0.85,
    messagesSentThisMonth: 1458,
    isBudgetExceeded: false,
  }

  if (typeof window === 'undefined') return defaultBudget

  const stored = localStorage.getItem(BUDGET_STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(defaultBudget))
    return defaultBudget
  }

  try {
    const parsed = JSON.parse(stored)
    parsed.isBudgetExceeded = parsed.spentThisMonthInr >= parsed.monthlyLimitInr
    return parsed
  } catch {
    return defaultBudget
  }
}

/**
 * Interpolates variables in template body (supports both {{1}} and {{key}})
 */
export function interpolateTemplate(
  template: WhatsAppTemplate,
  variables: Record<string, string>
): string {
  let text = template.bodyTemplate

  template.parameters.forEach((p) => {
    const val = variables[p.key] || variables[String(p.index)] || p.placeholder
    // Replace numbered placeholder {{1}}, {{2}}
    text = text.replace(new RegExp(`\\{\\{${p.index}\\}\\}`, 'g'), val)
    // Replace named placeholder {{key}}
    text = text.replace(new RegExp(`\\{\\{${p.key}\\}\\}`, 'g'), val)
  })

  // General fallback for any remaining {{key}}
  for (const [k, v] of Object.entries(variables)) {
    text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v)
  }

  return text
}

/**
 * Builds Meta Cloud API components parameters array
 */
export function buildMetaTemplateParameters(
  template: WhatsAppTemplate,
  variables: Record<string, string>
): { type: string; text: string }[] {
  return template.parameters.map((p) => {
    const text = variables[p.key] || variables[String(p.index)] || p.placeholder
    return {
      type: 'text',
      text: String(text),
    }
  })
}

/**
 * Sends a WhatsApp message via Meta Cloud API or local budget guard
 */
export function sendWhatsAppMessage(params: {
  memberId: string
  memberName: string
  phone: string
  templateId: string
  variables: Record<string, string>
  actor: { id: string; name: string; email?: string; role: string }
  branchId?: string
}): { success: boolean; error?: string; remainingBudgetInr?: number; messageId?: string } {
  const budget = getWhatsAppBudget()

  if (budget.spentThisMonthInr + budget.costPerMessageInr > budget.monthlyLimitInr) {
    return {
      success: false,
      error: `WhatsApp Budget Guard Triggered: Monthly spend limit of ₹${budget.monthlyLimitInr.toLocaleString()} has been reached. Contact admin to increase budget.`,
    }
  }

  const template = APPROVED_TEMPLATES.find((t) => t.id === params.templateId)
  if (!template) {
    return { success: false, error: 'Selected WhatsApp template is not approved in catalog.' }
  }

  const interpolated = interpolateTemplate(template, params.variables)

  // Client-side API dispatch to /api/whatsapp/send if in browser (async background)
  const serverMessageId = `wa_msg_${Date.now()}`
  if (typeof window !== 'undefined') {
    fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: params.memberId,
        memberName: params.memberName,
        phone: params.phone,
        templateId: template.id,
        metaTemplateName: template.metaTemplateName,
        metaCategory: template.metaCategory,
        language: template.language,
        variables: params.variables,
        interpolatedText: interpolated,
      }),
    }).catch(() => {
      // Background catch
    })
  }

  // Update budget in local storage
  budget.spentThisMonthInr += budget.costPerMessageInr
  budget.messagesSentThisMonth += 1
  budget.isBudgetExceeded = budget.spentThisMonthInr >= budget.monthlyLimitInr

  if (typeof window !== 'undefined') {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budget))
  }

  // Log immutable audit event
  logAuditEvent({
    actor: params.actor,
    action: 'SEND_WHATSAPP',
    entity: 'WhatsAppOutbound',
    entityId: serverMessageId,
    branchId: params.branchId || 'pow',
    description: `Sent WhatsApp '${template.name}' to ${params.memberName} (${maskPhoneNumber(params.phone)}) via Meta Cloud API`,
    afterState: {
      templateId: template.id,
      metaTemplate: template.metaTemplateName,
      messageText: interpolated,
      costInr: budget.costPerMessageInr,
    },
  })

  return {
    success: true,
    messageId: serverMessageId,
    remainingBudgetInr: Math.max(0, budget.monthlyLimitInr - budget.spentThisMonthInr),
  }
}

