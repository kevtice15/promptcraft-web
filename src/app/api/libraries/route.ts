import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateLibraryName, validateRequired } from '@/lib/validations'
import { getAccessibleLibraries } from '@/lib/permissions'
import bcrypt from 'bcrypt'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { owned, shared } = await getAccessibleLibraries(user.id)

    return NextResponse.json({ 
      libraries: owned,
      sharedLibraries: shared
    })

  } catch (error) {
    console.error('Libraries fetch error:', error)
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
    const { name, description, color, isPrivate, password, passwordHint } = body

    // Validation
    if (!validateRequired(name) || !validateLibraryName(name)) {
      return NextResponse.json(
        { error: 'Valid library name is required (max 100 characters)' },
        { status: 400 }
      )
    }

    if (isPrivate && !validateRequired(password)) {
      return NextResponse.json(
        { error: 'Password is required for private libraries' },
        { status: 400 }
      )
    }

    // Prepare library data
    const libraryData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      color: color || '#3b82f6',
      isPrivate: Boolean(isPrivate),
      ownerId: user.id
    }

    // Hash password if provided
    if (isPrivate && password) {
      libraryData.passwordHash = await bcrypt.hash(password, 12)
      libraryData.passwordHint = passwordHint?.trim() || null
    }

    const library = await prisma.library.create({
      data: libraryData,
      include: {
        groups: {
          include: {
            _count: {
              select: { prompts: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Library created successfully',
      library 
    })

  } catch (error) {
    console.error('Library creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}