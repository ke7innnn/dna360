import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, maskPhoneNumber } from '@/lib/server-auth'
import { getStoredMembers } from '@/lib/members'

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await getServerSession(req)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: error || 'Unauthorized: Authentication required.' },
        { status: 401 }
      )
    }

    const user = session.user
    const userCaps = user.role.capabilities || []
    const roleSlugLower = user.role.slug.toLowerCase()
    const isOwner = roleSlugLower === 'owner' || roleSlugLower === 'owner_admin'
    const canViewAll = isOwner || userCaps.includes('members.view.all')
    const canViewOwn = userCaps.includes('members.view.own')

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        {
          error: `Forbidden: Role '${user.role.name}' does not have permission to view members.`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)))
    const search = url.searchParams.get('search')?.toLowerCase().trim() || ''
    const statusFilter = url.searchParams.get('status') || 'all'
    const unmaskPii = url.searchParams.get('unmasked') === 'true' && isOwner

    // 1. Query Supabase Central PostgreSQL Database
    try {
      const { prisma } = await import('@/lib/prisma')
      const where: any = {}
      if (!canViewAll && canViewOwn) {
        where.assignedTrainerId = user.id
      }
      if (statusFilter !== 'all') {
        where.status = statusFilter
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { memberCode: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }

      const totalCount = await prisma.member.count({ where })
      if (totalCount > 0) {
        const dbRecords = await prisma.member.findMany({
          where,
          include: {
            memberships: {
              where: { status: 'active' },
            },
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { name: 'asc' },
        })

        const sanitizedRecords = dbRecords.map(m => ({
          id: m.id,
          member_code: m.memberCode,
          name: m.name,
          first_name: m.firstName,
          last_name: m.lastName,
          phone: unmaskPii ? m.phone : maskPhoneNumber(m.phone),
          isPhoneMasked: !unmaskPii,
          email: m.email,
          gender: m.gender,
          status: m.status,
          joined_date: m.joinedDate,
          attendance_streak: m.attendanceStreak || 0,
          total_check_ins: m.totalCheckIns || 0,
          active_memberships: m.memberships.map(ms => ({
            id: ms.id,
            product_name: ms.productName,
            expiry_date: ms.expiryDate,
            status: ms.status,
            sessions_remaining: ms.sessionsRemaining,
            sessions_total: ms.sessionsTotal,
          })),
          assigned_trainer_name: m.assignedTrainerName,
        }))

        return NextResponse.json({
          members: sanitizedRecords,
          pagination: {
            page,
            pageSize,
            total: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        })
      }
    } catch (dbErr) {
      console.warn('Supabase DB member query fallback:', dbErr)
    }

    let allMembers = getStoredMembers()

    // Trainer Role Restriction: Trainers ONLY see their own assigned clients
    if (!canViewAll && canViewOwn) {
      allMembers = allMembers.filter(m => m.assigned_trainer_id === user.id)
    }

    // Search filter
    if (search) {
      allMembers = allMembers.filter(
        m =>
          m.name.toLowerCase().includes(search) ||
          m.member_code.toLowerCase().includes(search) ||
          m.phone.includes(search) ||
          (m.email && m.email.toLowerCase().includes(search))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      allMembers = allMembers.filter(m => m.status === statusFilter)
    }

    const total = allMembers.length
    const totalPages = Math.ceil(total / pageSize)
    const offset = (page - 1) * pageSize
    const paginatedSlice = allMembers.slice(offset, offset + pageSize)

    // Mask PII (phone number) in list responses unless explicit unmasked request by Owner
    const sanitizedRecords = paginatedSlice.map(m => ({
      id: m.id,
      member_code: m.member_code,
      name: m.name,
      first_name: m.first_name,
      last_name: m.last_name,
      phone: unmaskPii ? m.phone : maskPhoneNumber(m.phone),
      isPhoneMasked: !unmaskPii,
      email: m.email,
      gender: m.gender,
      status: m.status,
      joined_date: m.joined_date,
      attendance_streak: m.attendance_streak || 0,
      total_check_ins: m.total_check_ins || 0,
      active_memberships: m.active_memberships.map(ms => ({
        id: ms.id,
        product_name: ms.product_name,
        expiry_date: ms.expiry_date,
        status: ms.status,
        sessions_remaining: ms.sessions_remaining,
        sessions_total: ms.sessions_total,
      })),
      assigned_trainer_name: m.assigned_trainer_name,
    }))

    return NextResponse.json({
      members: sanitizedRecords,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch members' }, { status: 500 })
  }
}
