import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  uploadImage, 
  validateImage, 
  validateImageCount, 
  validateTotalImageCount,
  ImageType,
  IMAGE_TYPES 
} from '@/lib/image-storage'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const promptId = formData.get('promptId') as string
    const type = formData.get('type') as ImageType
    const description = formData.get('description') as string
    const weight = formData.get('weight') ? parseFloat(formData.get('weight') as string) : undefined

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      )
    }

    if (!type || !Object.keys(IMAGE_TYPES).includes(type)) {
      return NextResponse.json(
        { error: 'Valid image type is required' },
        { status: 400 }
      )
    }

    // Verify prompt exists and user has access
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        group: {
          library: {
            ownerId: user.id
          }
        }
      }
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found or access denied' },
        { status: 404 }
      )
    }

    // Validate file
    const validation = validateImage(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Validate image counts
    await validateTotalImageCount(promptId)
    await validateImageCount(promptId, type)

    // Validate weight range
    if (weight !== undefined && (weight < 0.1 || weight > 2.0)) {
      return NextResponse.json(
        { error: 'Weight must be between 0.1 and 2.0' },
        { status: 400 }
      )
    }

    // Upload image
    const imageReference = await uploadImage(file, promptId, type, description, weight)
    
    // Update the uploadedBy field with actual user ID
    const updatedImage = await prisma.imageReference.update({
      where: { id: imageReference.id },
      data: { uploadedBy: user.id }
    })

    return NextResponse.json({ 
      message: 'Image uploaded successfully',
      image: updatedImage
    })

  } catch (error: any) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('promptId')

    if (!promptId) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      )
    }

    // Verify prompt exists and user has access
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        group: {
          library: {
            ownerId: user.id
          }
        }
      }
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found or access denied' },
        { status: 404 }
      )
    }

    // Get images for the prompt
    const images = await prisma.imageReference.findMany({
      where: { promptId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ images })

  } catch (error) {
    console.error('Image fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}