import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateRequired } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ savedSearch })

  } catch (error) {
    console.error('Saved search fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { name, filters } = body

    // Check if saved search exists and belongs to user
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    // Validation
    if (name !== undefined) {
      if (!validateRequired(name) || name.trim().length > 100) {
        return NextResponse.json(
          { error: 'Valid search name is required (max 100 characters)' },
          { status: 400 }
        )
      }

      // Check for name conflicts (excluding current search)
      const nameConflict = await prisma.savedSearch.findFirst({
        where: {
          userId: user.id,
          libraryId: existingSearch.libraryId,
          name: name.trim(),
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A saved search with this name already exists' },
          { status: 400 }
        )
      }
    }

    if (filters !== undefined && (typeof filters !== 'object' || filters === null)) {
      return NextResponse.json(
        { error: 'Search filters must be a valid object' },
        { status: 400 }
      )
    }

    // Update the saved search
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (filters !== undefined) updateData.filters = filters

    const savedSearch = await prisma.savedSearch.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      message: 'Saved search updated successfully',
      savedSearch
    })

  } catch (error) {
    console.error('Update saved search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Check if saved search exists and belongs to user
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    await prisma.savedSearch.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Saved search deleted successfully'
    })

  } catch (error) {
    console.error('Delete saved search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}