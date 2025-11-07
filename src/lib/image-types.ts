export const IMAGE_TYPES = {
  reference: { label: 'Reference', maxCount: 1, suggestedWeight: 1.0 },
  style: { label: 'Style', maxCount: 3, suggestedWeight: 0.75 },
  composition: { label: 'Composition', maxCount: 3, suggestedWeight: 0.6 },
  lighting: { label: 'Lighting', maxCount: 3, suggestedWeight: 0.5 },
  mood: { label: 'Mood', maxCount: 3, suggestedWeight: 0.5 },
  color: { label: 'Color Palette', maxCount: 3, suggestedWeight: 0.4 }
} as const

export type ImageType = keyof typeof IMAGE_TYPES

export interface ImageValidationResult {
  valid: boolean
  error?: string
}

export function validateImage(file: File): ImageValidationResult {
  // Check file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 10MB' }
  }

  // Check file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File must be PNG, JPG, JPEG, WebP, or AVIF' }
  }

  return { valid: true }
}

export function validateImageType(type: string): type is ImageType {
  return type in IMAGE_TYPES
}

export function validateImageWeight(weight: number): boolean {
  return weight >= 0 && weight <= 2.0
}