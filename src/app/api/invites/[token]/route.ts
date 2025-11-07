import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const invite = await prisma.libraryInvite.findFirst({
      where: {
        token,
        acceptedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        library: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true
          }
        },
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      invite: {
        email: invite.email,
        permission: invite.permission,
        library: invite.library,
        inviter: invite.inviter,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt
      }
    })

  } catch (error) {
    console.error('Invitation fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}