import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { unlockLibrary } from '@/lib/library-access'
import { validateRequired } from '@/lib/validations'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { password } = body

    // Validation
    if (!validateRequired(password)) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const success = await unlockLibrary(id, password)

    if (!success) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    return NextResponse.json({ 
      message: 'Library unlocked successfully' 
    })

  } catch (error) {
    console.error('Library unlock error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}