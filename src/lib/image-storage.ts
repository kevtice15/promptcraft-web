import { put, del } from '@vercel/blob'
import { prisma } from './prisma'
import sharp from 'sharp'

import { IMAGE_TYPES, ImageType, validateImage } from './image-types'

interface ImageDimensions {
  width: number
  height: number
}

// Re-export for backward compatibility
export { IMAGE_TYPES, ImageType, validateImage }

export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const metadata = await sharp(buffer).metadata()
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions')
  }

  // Check minimum dimensions
  if (metadata.width < 64 || metadata.height < 64) {
    throw new Error('Image must be at least 64x64 pixels')
  }

  // Check maximum dimensions  
  if (metadata.width > 8192 || metadata.height > 8192) {
    throw new Error('Image must be no larger than 8192x8192 pixels')
  }

  return {
    width: metadata.width,
    height: metadata.height
  }
}

export async function generateThumbnail(file: File, maxSize: number = 200): Promise<Buffer> {
  const buffer = Buffer.from(await file.arrayBuffer())
  
  return await sharp(buffer)
    .resize(maxSize, maxSize, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 85 })
    .toBuffer()
}

export async function uploadImage(
  file: File, 
  promptId: string, 
  type: ImageType,
  description?: string,
  weight?: number
): Promise<any> {
  // Validate the image
  const validation = validateImage(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Get image dimensions
  const dimensions = await getImageDimensions(file)

  // Generate unique filename
  const timestamp = Date.now()
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `${promptId}-${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`
  const thumbnailFileName = `thumb-${fileName}`

  try {
    // Upload original image
    const originalBlob = await put(fileName, file, {
      access: 'public',
      contentType: file.type,
    })

    // Generate and upload thumbnail
    const thumbnailBuffer = await generateThumbnail(file)
    const thumbnailBlob = await put(thumbnailFileName, thumbnailBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
    })

    // Create database record
    const imageReference = await prisma.imageReference.create({
      data: {
        promptId,
        fileName,
        originalFileName: file.name,
        type,
        description: description || null,
        weight: weight || IMAGE_TYPES[type].suggestedWeight,
        fileSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
        thumbnailUrl: thumbnailBlob.url,
        originalUrl: originalBlob.url,
        uploadedBy: null, // Will be set by API route with user context
      }
    })

    return imageReference

  } catch (error) {
    console.error('Failed to upload image:', error)
    throw new Error('Failed to upload image')
  }
}

export async function deleteImage(imageId: string): Promise<void> {
  try {
    // Get image record
    const image = await prisma.imageReference.findUnique({
      where: { id: imageId }
    })

    if (!image) {
      throw new Error('Image not found')
    }

    // Delete from blob storage
    const originalUrl = new URL(image.originalUrl)
    const thumbnailUrl = new URL(image.thumbnailUrl)
    
    const originalFileName = originalUrl.pathname.split('/').pop()
    const thumbnailFileName = thumbnailUrl.pathname.split('/').pop()

    if (originalFileName) {
      await del(originalFileName)
    }
    if (thumbnailFileName) {
      await del(thumbnailFileName)
    }

    // Delete from database
    await prisma.imageReference.delete({
      where: { id: imageId }
    })

  } catch (error) {
    console.error('Failed to delete image:', error)
    throw new Error('Failed to delete image')
  }
}

export async function validateImageCount(promptId: string, type: ImageType, excludeImageId?: string): Promise<void> {
  const maxCount = IMAGE_TYPES[type].maxCount
  
  const currentCount = await prisma.imageReference.count({
    where: {
      promptId,
      type,
      id: excludeImageId ? { not: excludeImageId } : undefined
    }
  })

  if (currentCount >= maxCount) {
    throw new Error(`Maximum ${maxCount} ${IMAGE_TYPES[type].label.toLowerCase()} image(s) allowed per prompt`)
  }
}

export async function validateTotalImageCount(promptId: string, excludeImageId?: string): Promise<void> {
  const currentCount = await prisma.imageReference.count({
    where: {
      promptId,
      id: excludeImageId ? { not: excludeImageId } : undefined
    }
  })

  if (currentCount >= 5) {
    throw new Error('Maximum 5 images allowed per prompt')
  }
}