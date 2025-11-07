import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteImage, IMAGE_TYPES, ImageType } from '@/lib/image-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Get image with prompt ownership check
    const image = await prisma.imageReference.findFirst({
      where: {
        id,
        prompt: {
          group: {
            library: {
              ownerId: user.id
            }
          }
        }
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({ image })

  } catch (error) {
    console.error('Image fetch error:', error)
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
    const { description, weight, type } = body

    // Get image with prompt ownership check
    const image = await prisma.imageReference.findFirst({
      where: {
        id,
        prompt: {
          group: {
            library: {
              ownerId: user.id
            }
          }
        }
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found or access denied' },
        { status: 404 }
      )
    }

    // Validate type if provided
    if (type && !Object.keys(IMAGE_TYPES).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid image type' },
        { status: 400 }
      )
    }

    // Validate weight if provided
    if (weight !== undefined && (weight < 0.1 || weight > 2.0)) {
      return NextResponse.json(
        { error: 'Weight must be between 0.1 and 2.0' },
        { status: 400 }
      )
    }

    // If changing type, validate count constraints
    if (type && type !== image.type) {
      const { validateImageCount } = await import('@/lib/image-storage')
      await validateImageCount(image.promptId, type as ImageType, id)
    }

    // Update image
    const updatedImage = await prisma.imageReference.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(weight !== undefined && { weight }),
        ...(type && { type })
      }
    })

    return NextResponse.json({ 
      message: 'Image updated successfully',
      image: updatedImage
    })

  } catch (error: any) {
    console.error('Image update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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

    // Get image with prompt ownership check
    const image = await prisma.imageReference.findFirst({
      where: {
        id,
        prompt: {
          group: {
            library: {
              ownerId: user.id
            }
          }
        }
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found or access denied' },
        { status: 404 }
      )
    }

    // Delete image (handles both blob storage and database)
    await deleteImage(id)

    return NextResponse.json({ 
      message: 'Image deleted successfully' 
    })

  } catch (error: any) {
    console.error('Image deletion error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}