export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): boolean {
  return password.length >= 8
}

export function validateRequired(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0)
}

export function validateLibraryName(name: string): boolean {
  return validateRequired(name) && name.trim().length <= 100
}

export function validateGroupName(name: string): boolean {
  return validateRequired(name) && name.trim().length <= 100
}

export function validatePositivePrompt(prompt: string): boolean {
  return validateRequired(prompt) && prompt.trim().length <= 5000
}

export function validateNegativePrompt(prompt: string | undefined): boolean {
  if (!prompt) return true
  return prompt.trim().length <= 2000
}

export function validateNotes(notes: string | undefined): boolean {
  if (!notes) return true
  return notes.trim().length <= 1000
}

export function validateSteps(steps: number): boolean {
  return Number.isInteger(steps) && steps >= 1 && steps <= 100
}

export function validateCfgScale(cfgScale: number): boolean {
  return cfgScale >= 1 && cfgScale <= 20
}

export function validateDimensions(width: number, height: number): boolean {
  const validSizes = [256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024]
  return validSizes.includes(width) && validSizes.includes(height)
}