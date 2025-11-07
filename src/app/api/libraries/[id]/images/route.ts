import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: libraryId } = await params

    // Verify library exists and user has access
    const library = await prisma.library.findFirst({
      where: { 
        id: libraryId,
        ownerId: user.id 
      }
    })

    if (!library) {
      return NextResponse.json(
        { error: 'Library not found or access denied' },
        { status: 404 }
      )
    }

    // Get all images for prompts in this library
    const images = await prisma.imageReference.findMany({
      where: {
        prompt: {
          group: {
            libraryId
          }
        }
      },
      include: {
        prompt: {
          select: {
            id: true,
            positivePrompt: true,
            group: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ images })

  } catch (error) {
    console.error('Library images fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}