import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requireLibraryAccess } from '@/lib/library-access'
import { prisma } from '@/lib/prisma'
import { validateGroupName, validateRequired } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const group = await prisma.group.findFirst({
      where: { id },
      include: {
        library: true,
        _count: {
          select: { prompts: true }
        }
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check if library belongs to user
    if (group.library.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check library access (for private libraries)
    try {
      await requireLibraryAccess(group.library)
    } catch (error: any) {
      if (error.message === 'LIBRARY_LOCKED') {
        return NextResponse.json(
          { error: 'Library is locked' },
          { status: 403 }
        )
      }
      throw error
    }

    return NextResponse.json({ group })

  } catch (error) {
    console.error('Group fetch error:', error)
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
    const { name, description } = body

    // Check if group exists and user owns the library
    const existingGroup = await prisma.group.findFirst({
      where: { id },
      include: { library: true }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    if (existingGroup.library.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check library access (for private libraries)
    await requireLibraryAccess(existingGroup.library)

    // Validation
    if (!validateRequired(name) || !validateGroupName(name)) {
      return NextResponse.json(
        { error: 'Valid group name is required (max 100 characters)' },
        { status: 400 }
      )
    }

    const group = await prisma.group.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      },
      include: {
        _count: {
          select: { prompts: true }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Group updated successfully',
      group 
    })

  } catch (error) {
    console.error('Group update error:', error)
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

    // Check if group exists and user owns the library
    const group = await prisma.group.findFirst({
      where: { id },
      include: { library: true }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    if (group.library.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check library access (for private libraries)
    try {
      await requireLibraryAccess(group.library)
    } catch (error: any) {
      if (error.message === 'LIBRARY_LOCKED') {
        return NextResponse.json(
          { error: 'Library is locked' },
          { status: 403 }
        )
      }
      throw error
    }

    // Delete group (cascades to prompts)
    await prisma.group.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Group deleted successfully' 
    })

  } catch (error) {
    console.error('Group deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}