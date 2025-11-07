import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requireLibraryAccess } from '@/lib/library-access'
import { prisma } from '@/lib/prisma'
import { 
  validatePositivePrompt, 
  validateNegativePrompt, 
  validateNotes,
  validateSteps,
  validateCfgScale,
  validateDimensions,
  validateRequired 
} from '@/lib/validations'
import { analyzeTemplate, generateTemplateMetadata } from '@/lib/wildcard-detector'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const libraryId = searchParams.get('libraryId')

    if (!groupId && !libraryId) {
      return NextResponse.json(
        { error: 'Group ID or Library ID is required' },
        { status: 400 }
      )
    }

    let whereCondition: any = {}

    if (groupId) {
      // Get prompts for specific group
      const group = await prisma.group.findFirst({
        where: { id: groupId },
        include: { library: true }
      })

      if (!group || group.library.ownerId !== user.id) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        )
      }

      try {
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
      } catch (error: any) {
        if (error.message === 'LIBRARY_LOCKED') {
          return NextResponse.json(
            { error: 'Library is locked' },
            { status: 403 }
          )
        }
        throw error
      }
      whereCondition = { groupId }
    } else if (libraryId) {
      // Get all prompts for library (across all groups)
      const library = await prisma.library.findFirst({
        where: { 
          id: libraryId,
          ownerId: user.id 
        }
      })

      if (!library) {
        return NextResponse.json(
          { error: 'Library not found' },
          { status: 404 }
        )
      }

      try {
        await requireLibraryAccess(library)
      } catch (error: any) {
        if (error.message === 'LIBRARY_LOCKED') {
          return NextResponse.json(
            { error: 'Library is locked' },
            { status: 403 }
          )
        }
        throw error
      }
      whereCondition = { 
        group: { libraryId } 
      }
    }

    const prompts = await prisma.prompt.findMany({
      where: whereCondition,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            libraryId: true
          }
        },
        images: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ prompts })

  } catch (error) {
    console.error('Prompts fetch error:', error)
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
    const {
      positivePrompt,
      negativePrompt,
      notes,
      steps,
      cfgScale,
      sampler,
      model,
      seed,
      width,
      height,
      groupId
    } = body

    // Validation
    if (!validateRequired(groupId)) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      )
    }

    if (!validatePositivePrompt(positivePrompt)) {
      return NextResponse.json(
        { error: 'Valid positive prompt is required (max 5000 characters)' },
        { status: 400 }
      )
    }

    if (!validateNegativePrompt(negativePrompt)) {
      return NextResponse.json(
        { error: 'Negative prompt is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    if (!validateNotes(notes)) {
      return NextResponse.json(
        { error: 'Notes are too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    if (!validateSteps(steps)) {
      return NextResponse.json(
        { error: 'Steps must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (!validateCfgScale(cfgScale)) {
      return NextResponse.json(
        { error: 'CFG Scale must be between 1 and 20' },
        { status: 400 }
      )
    }

    if (!validateDimensions(width, height)) {
      return NextResponse.json(
        { error: 'Invalid dimensions' },
        { status: 400 }
      )
    }

    // Check if group exists and user owns the library
    const group = await prisma.group.findFirst({
      where: { id: groupId },
      include: { library: true }
    })

    if (!group || group.library.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

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

    // Analyze template before creating prompt
    const trimmedPositivePrompt = positivePrompt.trim()
    const templateAnalysis = analyzeTemplate(trimmedPositivePrompt)
    const templateMetadata = generateTemplateMetadata(templateAnalysis)

    const prompt = await prisma.prompt.create({
      data: {
        positivePrompt: trimmedPositivePrompt,
        negativePrompt: negativePrompt?.trim() || null,
        notes: notes?.trim() || null,
        steps: parseInt(steps),
        cfgScale: parseFloat(cfgScale),
        sampler: sampler || 'Euler a',
        model: model || 'SD 1.5',
        seed: seed ? BigInt(seed) : null,
        width: parseInt(width),
        height: parseInt(height),
        hasTemplate: templateAnalysis.hasTemplate,
        wildcardCount: templateAnalysis.wildcardCount,
        templateMetadata: templateMetadata,
        groupId
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            libraryId: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Prompt created successfully',
      prompt 
    })

  } catch (error) {
    console.error('Prompt creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}