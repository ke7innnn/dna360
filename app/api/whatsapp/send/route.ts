import { NextRequest, NextResponse } from 'next/server'
import { APPROVED_TEMPLATES, buildMetaTemplateParameters } from '@/lib/whatsapp'
import { getServerSession, maskPhoneNumber } from '@/lib/server-auth'
import { hasCapability } from '@/config/permissions'
import { logAuditEvent } from '@/lib/audit'
import { hit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate caller session fail-closed (§4.1)
    const { session } = await getServerSession(req)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid authentication session required.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // 2. Reject member accounts and enforce staff whatsapp.send capability (§4.1)
    const roleSlug = session.user.role?.slug?.toLowerCase() || ''
    const isMember = session.user.type === 'MEMBER' || roleSlug === 'member'
    if (isMember) {
      return NextResponse.json(
        { error: 'Forbidden: Members are not permitted to send outbound WhatsApp messages.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    if (!hasCapability(session.user.role?.slug || '', 'whatsapp.send')) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to dispatch WhatsApp messages.', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      phone,
      metaTemplateName,
      language = 'en',
      variables = {},
    } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Recipient phone number is required' },
        { status: 400 }
      )
    }

    // 3. Enforce strict approved-template allow-list (zero free-text send path)
    const template = APPROVED_TEMPLATES.find(
      (t) => (metaTemplateName && t.metaTemplateName === metaTemplateName) || (body.templateId && t.id === body.templateId)
    )

    if (!template) {
      return NextResponse.json(
        { error: `Template '${metaTemplateName || body.templateId}' not found in approved catalog.` },
        { status: 400 }
      )
    }

    // 4. Rate limiting: max 50 sends/hour per user via rate_limit_events helper (§4.1)
    const rateLimit = await hit(`wa_send:${session.user.id}`, 50, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: Maximum 50 outbound WhatsApp messages per hour.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSec) },
        }
      )
    }

    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    // Normalize phone number (E.164 without '+', e.g. 919820011111)
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json(
        { error: 'Valid recipient phone number (10 to 15 digits) is required' },
        { status: 400 }
      )
    }
    const formattedRecipient = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

    let channel = 'SIMULATED_LOG'
    let messageId = `sim_wamid_${Date.now()}`

    // If Meta credentials exist, call Meta Graph API
    if (phoneId && accessToken) {
      const metaParameters = buildMetaTemplateParameters(template, variables)

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedRecipient,
        type: 'template',
        template: {
          name: template.metaTemplateName,
          language: {
            code: template.language || language,
          },
          components: [
            {
              type: 'body',
              parameters: metaParameters,
            },
          ],
        },
      }

      const metaRes = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const metaData = await metaRes.json()

      if (!metaRes.ok) {
        console.error('Meta WhatsApp Cloud API Error:', metaData)
        return NextResponse.json(
          {
            error:
              metaData?.error?.message ||
              'Meta WhatsApp Cloud API rejected the outbound message.',
            metaError: metaData?.error,
          },
          { status: 502 }
        )
      }

      channel = 'META_CLOUD_API'
      messageId = metaData?.messages?.[0]?.id || `wamid_${Date.now()}`
    }

    // 5. Write mandatory immutable audit log record for every send (§4.1)
    logAuditEvent({
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email || undefined,
        role: session.user.role?.name || 'Staff',
      },
      action: 'SEND_WHATSAPP',
      entity: 'WhatsAppOutbound',
      entityId: messageId,
      branchId: session.user.branchId || 'pow',
      description: `Dispatched WhatsApp template '${template.metaTemplateName}' to ${maskPhoneNumber(formattedRecipient)}`,
      afterState: {
        templateId: template.id,
        metaTemplateName: template.metaTemplateName,
        recipient: maskPhoneNumber(formattedRecipient),
        channel,
      },
    })

    return NextResponse.json({
      success: true,
      channel,
      messageId,
      recipient: formattedRecipient,
      template: template.metaTemplateName,
    })
  } catch (err: any) {
    console.error('WhatsApp API Send Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error dispatching WhatsApp message' },
      { status: 500 }
    )
  }
}
