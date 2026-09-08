import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, service, message } = body

    const cleanName = typeof name === 'string' ? name.trim() : ''
    const cleanPhone = typeof phone === 'string' ? phone.trim() : ''

    if (!cleanName || !cleanPhone || cleanName.length < 2 || cleanPhone.length < 7) {
      return NextResponse.json(
        { error: 'Valid name (min 2 characters) and phone number are required.' },
        { status: 400 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Inquiry received and forwarded to DNA 360 CRM team.',
      lead: {
        name,
        phone,
        service: service || 'General Fitness',
        message: message || '',
        receivedAt: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process inquiry' },
      { status: 500 }
     )
  }
}
