import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { markLibraryAsAccessible } from '@/lib/library-access'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Verify the library exists and belongs to the user
    const library = await prisma.library.findFirst({
      where: { 
        id,
        ownerId: user.id 
      }
    })

    if (!library) {
      return NextResponse.json(
        { error: 'Library not found' },
        { status: 404 }
      )
    }

    // Mark the library as accessible for this user's session
    await markLibraryAsAccessible(id)

    return NextResponse.json({ 
      message: 'Library marked as accessible' 
    })

  } catch (error) {
    console.error('Mark library accessible error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}