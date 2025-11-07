import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { acceptLibraryInvite } from '@/lib/permissions'
import { validateRequired } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { token } = body

    // Validation
    if (!validateRequired(token)) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    const library = await acceptLibraryInvite(token, user.id)

    return NextResponse.json({ 
      message: 'Invitation accepted successfully',
      library: {
        id: library.id,
        name: library.name,
        description: library.description
      }
    })

  } catch (error: any) {
    console.error('Invitation acceptance error:', error)
    
    if (error.message === 'Invalid or expired invitation') {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }
    
    if (error.message === 'This invitation is not for your email address') {
      return NextResponse.json(
        { error: 'This invitation is not for your email address' },
        { status: 403 }
      )
    }
    
    if (error.message === 'You already have access to this library') {
      return NextResponse.json(
        { error: 'You already have access to this library' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}