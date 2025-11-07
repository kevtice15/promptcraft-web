import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { removeLibraryAccess, updateLibraryPermission } from '@/lib/permissions'
import { validateRequired } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, userId: string }> }
) {
  try {
    const user = await requireAuth()
    const { id, userId } = await params
    const body = await request.json()
    const { permission } = body

    // Validation
    if (!validateRequired(permission) || !['read', 'write', 'admin'].includes(permission)) {
      return NextResponse.json(
        { error: 'Valid permission level is required (read, write, admin)' },
        { status: 400 }
      )
    }

    await updateLibraryPermission(id, userId, permission, user.id)

    return NextResponse.json({ 
      message: 'Permission updated successfully' 
    })

  } catch (error: any) {
    console.error('Library permission update error:', error)
    
    if (error.message === 'Library not found or access denied' || 
        error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Library not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Cannot change owner permissions' ||
        error.message === 'User does not have access to this library') {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, userId: string }> }
) {
  try {
    const user = await requireAuth()
    const { id, userId } = await params

    await removeLibraryAccess(id, userId, user.id)

    return NextResponse.json({ 
      message: 'Access removed successfully' 
    })

  } catch (error: any) {
    console.error('Library access removal error:', error)
    
    if (error.message === 'Library not found or access denied' || 
        error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Library not found' },
        { status: 404 }
      )
    }
    
    if (error.message === 'Cannot remove owner access' ||
        error.message === 'User does not have access to this library') {
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