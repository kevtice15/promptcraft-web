import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requireLibraryAccess } from '@/lib/library-access'
import { prisma } from '@/lib/prisma'
import { validateRequired } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const libraryId = searchParams.get('libraryId')
    const query = searchParams.get('q')
    const onlyFavorites = searchParams.get('favorites') === 'true'

    if (!validateRequired(libraryId)) {
      return NextResponse.json(
        { error: 'Library ID is required' },
        { status: 400 }
      )
    }

    if (!validateRequired(query)) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Check if library exists and belongs to user
    const library = await prisma.library.findFirst({
      where: { 
        id: libraryId,
        ownerId: user.id 
      }
    })

    if (!library) {
      return NextResponse.json(
        { error: 'Library not found' },
        { status: 404 }
      )
    }

    try {
      await requireLibraryAccess(library)
    } catch (error: any) {
      if (error.message === 'LIBRARY_LOCKED') {
        return NextResponse.json(
          { error: 'Library is locked' },
          { status: 403 }
        )
      }
      throw error
    }

    // Build search conditions
    const searchConditions: any = {
      group: { libraryId },
      OR: [
        {
          positivePrompt: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          negativePrompt: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          notes: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          group: {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    if (onlyFavorites) {
      searchConditions.isFavorite = true
    }

    const prompts = await prisma.prompt.findMany({
      where: searchConditions,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            libraryId: true
          }
        }
      },
      orderBy: [
        { isFavorite: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ 
      prompts,
      query,
      count: prompts.length
    })

  } catch (error) {
    console.error('Prompt search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}