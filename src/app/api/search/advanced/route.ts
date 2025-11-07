import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { executeAdvancedSearch } from '@/lib/advanced-search'
import { SearchFilters } from '@/types/search'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const {
      libraryId,
      filters,
      page = 1,
      pageSize = 20
    }: {
      libraryId: string
      filters: SearchFilters
      page?: number
      pageSize?: number
    } = body

    if (!libraryId) {
      return NextResponse.json(
        { error: 'Library ID is required' },
        { status: 400 }
      )
    }

    // Validate page and pageSize
    const validPage = Math.max(1, page)
    const validPageSize = Math.min(Math.max(1, pageSize), 100) // Max 100 per page

    // Convert date strings back to Date objects
    if (filters.createdAfter) {
      filters.createdAfter = new Date(filters.createdAfter)
    }
    if (filters.createdBefore) {
      filters.createdBefore = new Date(filters.createdBefore)
    }
    if (filters.modifiedAfter) {
      filters.modifiedAfter = new Date(filters.modifiedAfter)
    }
    if (filters.modifiedBefore) {
      filters.modifiedBefore = new Date(filters.modifiedBefore)
    }

    // Execute the search
    const searchResults = await executeAdvancedSearch(
      user.id,
      libraryId,
      filters,
      validPage,
      validPageSize
    )

    return NextResponse.json(searchResults)

  } catch (error: any) {
    console.error('Advanced search error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}