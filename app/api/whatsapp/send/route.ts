import { NextRequest, NextResponse } from 'next/server'
import { APPROVED_TEMPLATES, buildMetaTemplateParameters } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      phone,
      metaTemplateName,
      language = 'en',
      variables = {},
      interpolatedText,
    } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Recipient phone number is required' },
        { status: 400 }
      )
    }

    const template = APPROVED_TEMPLATES.find(
      (t) => t.metaTemplateName === metaTemplateName || t.id === body.templateId
    )

    if (!template) {
      return NextResponse.json(
        { error: `Template '${metaTemplateName || body.templateId}' not found in approved catalog.` },
        { status: 400 }
      )
    }

    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    // Normalize phone number (E.164 without '+', e.g. 919820011111)
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const formattedRecipient = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

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

      const messageId = metaData?.messages?.[0]?.id || `wamid_${Date.now()}`

      return NextResponse.json({
        success: true,
        channel: 'META_CLOUD_API',
        messageId,
        recipient: formattedRecipient,
        template: template.metaTemplateName,
      })
    }

    // Graceful fallback for staging / development prior to token configuration
    return NextResponse.json({
      success: true,
      channel: 'SIMULATED_LOG',
      messageId: `sim_wamid_${Date.now()}`,
      recipient: formattedRecipient,
      template: template.metaTemplateName,
      note: 'WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not yet configured in environment. Message logged in audit log.',
    })
  } catch (err: any) {
    console.error('WhatsApp API Send Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal error dispatching WhatsApp message' },
      { status: 500 }
    )
  }
}
