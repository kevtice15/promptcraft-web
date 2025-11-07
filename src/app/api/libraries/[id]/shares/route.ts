import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getLibraryShares, createLibraryInvite } from '@/lib/permissions'
import { validateRequired } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const { shares, pendingInvites } = await getLibraryShares(id, user.id)

    return NextResponse.json({ shares, pendingInvites })

  } catch (error: any) {
    console.error('Library shares fetch error:', error)
    
    if (error.message === 'Library not found or access denied' || 
        error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Library not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { email, permission } = body

    // Validation
    if (!validateRequired(email) || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    if (!validateRequired(permission) || !['read', 'write', 'admin'].includes(permission)) {
      return NextResponse.json(
        { error: 'Valid permission level is required (read, write, admin)' },
        { status: 400 }
      )
    }

    const token = await createLibraryInvite(id, user.id, email.toLowerCase(), permission)

    // In a real app, you would send an email here
    // For now, we'll return the token for testing
    return NextResponse.json({ 
      message: 'Invitation sent successfully',
      token // Remove this in production
    })

  } catch (error: any) {
    console.error('Library invite creation error:', error)
    
    if (error.message === 'Library not found or access denied' || 
        error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Library not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'User already has access to this library' ||
        error.message === 'Pending invitation already exists for this email') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}