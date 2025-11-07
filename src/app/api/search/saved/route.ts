import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateRequired } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const libraryId = searchParams.get('libraryId')

    const whereClause: any = {
      userId: user.id
    }

    if (libraryId) {
      whereClause.libraryId = libraryId
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ savedSearches })

  } catch (error) {
    console.error('Saved searches fetch error:', error)
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
    const { name, libraryId, filters } = body

    // Validation
    if (!validateRequired(name) || name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Valid search name is required (max 100 characters)' },
        { status: 400 }
      )
    }

    if (!filters || typeof filters !== 'object') {
      return NextResponse.json(
        { error: 'Search filters are required' },
        { status: 400 }
      )
    }

    // Check if user already has a saved search with this name in this library
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        userId: user.id,
        libraryId: libraryId || null,
        name: name.trim()
      }
    })

    if (existingSearch) {
      return NextResponse.json(
        { error: 'A saved search with this name already exists' },
        { status: 400 }
      )
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        name: name.trim(),
        userId: user.id,
        libraryId: libraryId || null,
        filters
      }
    })

    return NextResponse.json({
      message: 'Search saved successfully',
      savedSearch
    })

  } catch (error) {
    console.error('Save search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}