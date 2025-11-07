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
  validateDimensions
} from '@/lib/validations'
import { analyzeTemplate, generateTemplateMetadata } from '@/lib/wildcard-detector'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const prompt = await prisma.prompt.findFirst({
      where: { id },
      include: {
        group: {
          include: { library: true }
        },
        images: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    if (prompt.group.library.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    try {
      await requireLibraryAccess(prompt.group.library)
    } catch (error: any) {
      if (error.message === 'LIBRARY_LOCKED') {
        return NextResponse.json(
          { error: 'Library is locked' },
          { status: 403 }
        )
      }
      throw error
    }

    return NextResponse.json({ prompt })

  } catch (error) {
    console.error('Prompt fetch error:', error)
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
      isFavorite
    } = body

    // Check if prompt exists and user owns it
    const existingPrompt = await prisma.prompt.findFirst({
      where: { id },
      include: {
        group: { include: { library: true } }
      }
    })

    if (!existingPrompt || existingPrompt.group.library.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    try {
      await requireLibraryAccess(existingPrompt.group.library)
    } catch (error: any) {
      if (error.message === 'LIBRARY_LOCKED') {
        return NextResponse.json(
          { error: 'Library is locked' },
          { status: 403 }
        )
      }
      throw error
    }

    // Validation (only if fields are provided)
    if (positivePrompt !== undefined && !validatePositivePrompt(positivePrompt)) {
      return NextResponse.json(
        { error: 'Valid positive prompt is required (max 5000 characters)' },
        { status: 400 }
      )
    }

    if (negativePrompt !== undefined && !validateNegativePrompt(negativePrompt)) {
      return NextResponse.json(
        { error: 'Negative prompt is too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    if (notes !== undefined && !validateNotes(notes)) {
      return NextResponse.json(
        { error: 'Notes are too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    if (steps !== undefined && !validateSteps(steps)) {
      return NextResponse.json(
        { error: 'Steps must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (cfgScale !== undefined && !validateCfgScale(cfgScale)) {
      return NextResponse.json(
        { error: 'CFG Scale must be between 1 and 20' },
        { status: 400 }
      )
    }

    if ((width !== undefined || height !== undefined) && 
        !validateDimensions(width || existingPrompt.width, height || existingPrompt.height)) {
      return NextResponse.json(
        { error: 'Invalid dimensions' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (positivePrompt !== undefined) {
      const trimmedPositivePrompt = positivePrompt.trim()
      updateData.positivePrompt = trimmedPositivePrompt
      
      // Analyze template if positive prompt is being updated
      const templateAnalysis = analyzeTemplate(trimmedPositivePrompt)
      const templateMetadata = generateTemplateMetadata(templateAnalysis)
      
      updateData.hasTemplate = templateAnalysis.hasTemplate
      updateData.wildcardCount = templateAnalysis.wildcardCount
      updateData.templateMetadata = templateMetadata
    }
    if (negativePrompt !== undefined) updateData.negativePrompt = negativePrompt?.trim() || null
    if (notes !== undefined) updateData.notes = notes?.trim() || null
    if (steps !== undefined) updateData.steps = parseInt(steps)
    if (cfgScale !== undefined) updateData.cfgScale = parseFloat(cfgScale)
    if (sampler !== undefined) updateData.sampler = sampler
    if (model !== undefined) updateData.model = model
    if (seed !== undefined) updateData.seed = seed ? BigInt(seed) : null
    if (width !== undefined) updateData.width = parseInt(width)
    if (height !== undefined) updateData.height = parseInt(height)
    if (isFavorite !== undefined) updateData.isFavorite = Boolean(isFavorite)

    const prompt = await prisma.prompt.update({
      where: { id },
      data: updateData,
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
      message: 'Prompt updated successfully',
      prompt 
    })

  } catch (error) {
    console.error('Prompt update error:', error)
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

    // Check if prompt exists and user owns it
    const prompt = await prisma.prompt.findFirst({
      where: { id },
      include: {
        group: { include: { library: true } }
      }
    })

    if (!prompt || prompt.group.library.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    try {
      await requireLibraryAccess(prompt.group.library)
    } catch (error: any) {
      if (error.message === 'LIBRARY_LOCKED') {
        return NextResponse.json(
          { error: 'Library is locked' },
          { status: 403 }
        )
      }
      throw error
    }

    await prisma.prompt.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Prompt deleted successfully' 
    })

  } catch (error) {
    console.error('Prompt deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}