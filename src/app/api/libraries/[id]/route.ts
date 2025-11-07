import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateLibraryName, validateRequired } from '@/lib/validations'
import { markLibraryAsAccessible } from '@/lib/library-access'
import bcrypt from 'bcrypt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const library = await prisma.library.findFirst({
      where: { 
        id,
        ownerId: user.id 
      },
      include: {
        groups: {
          include: {
            _count: {
              select: { prompts: true }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!library) {
      return NextResponse.json(
        { error: 'Library not found' },
        { status: 404 }
      )
    }

    // If user can access this library (they own it), mark it as accessible
    // This ensures consistency between library access and group/prompt operations
    await markLibraryAsAccessible(id)

    return NextResponse.json({ library })

  } catch (error) {
    console.error('Library fetch error:', error)
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
    const { name, description, color, isPrivate, password, passwordHint } = body

    // Check if library exists and belongs to user
    const existingLibrary = await prisma.library.findFirst({
      where: { 
        id,
        ownerId: user.id 
      }
    })

    if (!existingLibrary) {
      return NextResponse.json(
        { error: 'Library not found' },
        { status: 404 }
      )
    }

    // Validation
    if (!validateRequired(name) || !validateLibraryName(name)) {
      return NextResponse.json(
        { error: 'Valid library name is required (max 100 characters)' },
        { status: 400 }
      )
    }

    if (isPrivate && !validateRequired(password) && !existingLibrary.passwordHash) {
      return NextResponse.json(
        { error: 'Password is required for private libraries' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      color: color || '#3b82f6',
      isPrivate: Boolean(isPrivate)
    }

    // Handle password changes
    if (isPrivate) {
      if (password) {
        // New password provided
        updateData.passwordHash = await bcrypt.hash(password, 12)
      }
      updateData.passwordHint = passwordHint?.trim() || null
    } else {
      // Library is no longer private
      updateData.passwordHash = null
      updateData.passwordHint = null
    }

    const library = await prisma.library.update({
      where: { id },
      data: updateData,
      include: {
        groups: {
          include: {
            _count: {
              select: { prompts: true }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Library updated successfully',
      library 
    })

  } catch (error) {
    console.error('Library update error:', error)
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

    // Check if library exists and belongs to user
    const library = await prisma.library.findFirst({
      where: { 
        id,
        ownerId: user.id 
      }
    })

    if (!library) {
      return NextResponse.json(
        { error: 'Library not found' },
        { status: 404 }
      )
    }

    // Delete library (cascades to groups and prompts)
    await prisma.library.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Library deleted successfully' 
    })

  } catch (error) {
    console.error('Library deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}