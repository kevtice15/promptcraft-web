import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getSearchSuggestions } from '@/lib/advanced-search'

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

    const suggestions = await getSearchSuggestions(user.id, libraryId)

    return NextResponse.json(suggestions)

  } catch (error) {
    console.error('Search suggestions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}