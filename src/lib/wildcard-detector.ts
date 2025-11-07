export interface WildcardMatch {
  type: string
  text: string
  position: number
  length: number
}

export interface TemplateAnalysis {
  hasTemplate: boolean
  wildcardCount: number
  wildcards: WildcardMatch[]
  complexity: 'none' | 'simple' | 'moderate' | 'complex'
  categories: string[]
}

// Wildcard patterns to detect
const WILDCARD_PATTERNS = {
  curlyBraces: {
    regex: /\{[^{}]+\}/g,
    label: 'Variables',
    description: 'Curly brace variables like {character} or {style}'
  },
  squareBrackets: {
    regex: /\[[^\[\]]*\|[^\[\]]*\]/g,
    label: 'Options',
    description: 'Square bracket options like [red|blue|green]'
  },
  doubleParens: {
    regex: /\(\([^()]+\)\)/g,
    label: 'Emphasis',
    description: 'Double parentheses for emphasis like ((masterpiece))'
  },
  loraReferences: {
    regex: /<lora:[^>]+>/g,
    label: 'LoRA',
    description: 'LoRA model references like <lora:model_name:0.8>'
  },
  dollarVariables: {
    regex: /\$[a-zA-Z_][a-zA-Z0-9_]*/g,
    label: 'Variables',
    description: 'Dollar sign variables like $character or $background'
  }
}

export function analyzeTemplate(text: string): TemplateAnalysis {
  if (!text || typeof text !== 'string') {
    return {
      hasTemplate: false,
      wildcardCount: 0,
      wildcards: [],
      complexity: 'none',
      categories: []
    }
  }

  const wildcards: WildcardMatch[] = []
  const categories = new Set<string>()

  // Find all wildcard matches
  Object.entries(WILDCARD_PATTERNS).forEach(([type, pattern]) => {
    const matches = Array.from(text.matchAll(pattern.regex))
    
    matches.forEach(match => {
      if (match.index !== undefined) {
        wildcards.push({
          type,
          text: match[0],
          position: match.index,
          length: match[0].length
        })
        categories.add(pattern.label)
      }
    })
  })

  // Sort wildcards by position
  wildcards.sort((a, b) => a.position - b.position)

  const wildcardCount = wildcards.length
  const hasTemplate = wildcardCount > 0

  // Determine complexity
  let complexity: 'none' | 'simple' | 'moderate' | 'complex' = 'none'
  if (wildcardCount === 0) {
    complexity = 'none'
  } else if (wildcardCount <= 2) {
    complexity = 'simple'
  } else if (wildcardCount <= 5) {
    complexity = 'moderate'
  } else {
    complexity = 'complex'
  }

  return {
    hasTemplate,
    wildcardCount,
    wildcards,
    complexity,
    categories: Array.from(categories)
  }
}

export function getComplexityColor(complexity: string): string {
  switch (complexity) {
    case 'simple':
      return 'bg-blue-100 text-blue-700'
    case 'moderate':
      return 'bg-purple-100 text-purple-700'
    case 'complex':
      return 'bg-pink-100 text-pink-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function getComplexityLabel(complexity: string): string {
  switch (complexity) {
    case 'simple':
      return 'Simple'
    case 'moderate':
      return 'Moderate'
    case 'complex':
      return 'Complex'
    default:
      return 'None'
  }
}

// Helper function to highlight wildcards in text for display
export function highlightWildcards(text: string, wildcards: WildcardMatch[]): string {
  if (wildcards.length === 0) return text

  let highlighted = text
  let offset = 0

  // Apply highlights in reverse order to maintain positions
  wildcards
    .slice()
    .reverse()
    .forEach(wildcard => {
      const before = highlighted.slice(0, wildcard.position + offset)
      const match = highlighted.slice(
        wildcard.position + offset,
        wildcard.position + wildcard.length + offset
      )
      const after = highlighted.slice(wildcard.position + wildcard.length + offset)
      
      const highlightClass = getWildcardHighlightClass(wildcard.type)
      const highlighted_match = `<span class="${highlightClass}">${match}</span>`
      
      highlighted = before + highlighted_match + after
      offset += highlighted_match.length - match.length
    })

  return highlighted
}

function getWildcardHighlightClass(type: string): string {
  switch (type) {
    case 'curlyBraces':
      return 'bg-yellow-200 text-yellow-800 px-1 rounded'
    case 'squareBrackets':
      return 'bg-green-200 text-green-800 px-1 rounded'
    case 'doubleParens':
      return 'bg-blue-200 text-blue-800 px-1 rounded'
    case 'loraReferences':
      return 'bg-purple-200 text-purple-800 px-1 rounded'
    case 'dollarVariables':
      return 'bg-orange-200 text-orange-800 px-1 rounded'
    default:
      return 'bg-gray-200 text-gray-800 px-1 rounded'
  }
}

// Generate template metadata for storage
export function generateTemplateMetadata(analysis: TemplateAnalysis): any {
  if (!analysis.hasTemplate) return null

  return {
    wildcards: analysis.wildcards.map(w => ({
      type: w.type,
      text: w.text,
      position: w.position
    })),
    complexity: analysis.complexity,
    categories: analysis.categories,
    analyzedAt: new Date().toISOString()
  }
}

// Example wildcard patterns for testing
export const EXAMPLE_WILDCARDS = {
  curlyBraces: 'A beautiful {character} in {style} art style',
  squareBrackets: 'A [red|blue|green] car on the [street|highway]',
  doubleParens: 'A ((masterpiece)) photo with ((high quality)) details',
  loraReferences: 'Beautiful woman <lora:realistic_vision:0.8> in portrait style',
  dollarVariables: 'A $character_type sitting in $location with $mood lighting',
  mixed: 'A {character} with [red|blue] hair, ((masterpiece)) quality, <lora:style_model:0.7> and $background_type'
}