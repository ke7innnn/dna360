import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  try {
    const { session } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const rows = await prisma.coachNote.findMany({
      where: { authorId: 'CRM_INQUIRY' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const inquiries = rows
      .map((r) => {
        try {
          const parsed = JSON.parse(r.body)
          if (parsed?._deleted) return null
          return {
            id: parsed.id || r.id,
            ...parsed,
            createdAt: parsed.createdAt || r.createdAt.toISOString(),
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)

    return NextResponse.json({ inquiries })
  } catch (err: any) {
    return NextResponse.json({ inquiries: [], warning: err.message })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = (body.name || body.prospectName || '').trim()
    const phone = (body.phone || '').trim()

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required.' },
        { status: 400 }
      )
    }

    const inquiryId = body.id || `lead_supa_${Date.now()}`
    const nowIso = new Date().toISOString()
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    const inquiryRecord = {
      id: inquiryId,
      name,
      phone,
      email: body.email || '',
      source: body.source || 'Website',
      stage: body.stage || 'new',
      interestType: body.interestType || body.interest || 'Annual Membership',
      assignedTo: body.assignedTo || 'usr_sales_01',
      assignedToName: body.assignedToName || 'Pallavi More',
      branchId: body.branchId || 'pow',
      branchName: body.branchName || 'Powai',
      notes: body.notes || (body.program ? `Interested in ${body.program}` : 'Submitted inquiry via portal'),
      nextFollowUpDate: body.nextFollowUpDate || tomorrowDate,
      followUpHistory: Array.isArray(body.followUpHistory)
        ? body.followUpHistory
        : [
            {
              id: `fup_${Date.now()}`,
              date: nowIso,
              note: body.notes || 'Initial inquiry recorded in Supabase CRM',
              loggedBy: body.assignedToName || 'System',
            },
          ],
      createdAt: body.createdAt || nowIso,
      updatedAt: nowIso,
    }

    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.coachNote.upsert({
        where: { id: inquiryId },
        update: {
          body: JSON.stringify(inquiryRecord),
        },
        create: {
          id: inquiryId,
          authorId: 'CRM_INQUIRY',
          memberId: body.memberId || phone,
          body: JSON.stringify(inquiryRecord),
        },
      })
    } catch (dbErr) {
      console.warn('POST /api/inquiries DB fallback:', dbErr)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Inquiry captured successfully.',
        inquiry: inquiryRecord,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request payload.' },
      { status: 400 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const id = body.id || body.leadId
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const existing = await prisma.coachNote.findUnique({ where: { id } }).catch(() => null)
    let merged: any = { id, ...body, updatedAt: new Date().toISOString() }
    if (existing) {
      try {
        const prev = JSON.parse(existing.body)
        merged = { ...prev, ...body, id, updatedAt: new Date().toISOString() }
      } catch {
        // ignore parse error
      }
      await prisma.coachNote.update({
        where: { id },
        data: { body: JSON.stringify(merged) },
      })
    } else if (body.name && body.phone) {
      await prisma.coachNote.create({
        data: {
          id,
          authorId: 'CRM_INQUIRY',
          memberId: body.phone,
          body: JSON.stringify(merged),
        },
      }).catch(() => null)
    }

    return NextResponse.json({ success: true, inquiry: merged })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update inquiry' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { session } = await getServerSession(req)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    let id = url.searchParams.get('id')
    if (!id) {
      const body = await req.json().catch(() => ({}))
      id = body.id || body.leadId
    }
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const existing = await prisma.coachNote.findUnique({ where: { id } }).catch(() => null)
    if (existing) {
      await prisma.coachNote.delete({ where: { id } }).catch(async () => {
        let prev: Record<string, any> = { id }
        try {
          prev = JSON.parse(existing.body)
        } catch {
          // ignore
        }
        await prisma.coachNote.update({
          where: { id },
          data: { body: JSON.stringify({ ...prev, id, _deleted: true, deletedAt: new Date().toISOString() }) },
        }).catch(() => null)
      })
    }

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete inquiry' }, { status: 500 })
  }
}
