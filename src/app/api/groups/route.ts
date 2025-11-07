import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requireLibraryAccess } from '@/lib/library-access'
import { prisma } from '@/lib/prisma'
import { validateGroupName, validateRequired } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const libraryId = searchParams.get('libraryId')

    if (!libraryId) {
      return NextResponse.json(
        { error: 'Library ID is required' },
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

    // Check library access (for private libraries)
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

    const groups = await prisma.group.findMany({
      where: { libraryId },
      include: {
        _count: {
          select: { prompts: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ groups })

  } catch (error) {
    console.error('Groups fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, description, libraryId } = body

    // Validation
    if (!validateRequired(name) || !validateGroupName(name)) {
      return NextResponse.json(
        { error: 'Valid group name is required (max 100 characters)' },
        { status: 400 }
      )
    }

    if (!validateRequired(libraryId)) {
      return NextResponse.json(
        { error: 'Library ID is required' },
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

    // Check library access (for private libraries)
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

    // Get the next sort order
    const maxSortOrder = await prisma.group.aggregate({
      where: { libraryId },
      _max: { sortOrder: true }
    })

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        libraryId,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1
      },
      include: {
        _count: {
          select: { prompts: true }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Group created successfully',
      group 
    })

  } catch (error) {
    console.error('Group creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}