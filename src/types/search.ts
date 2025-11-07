export interface SearchFilters {
  // Text search
  query?: string
  
  // Boolean filters
  favoritesOnly?: boolean
  templatesOnly?: boolean
  hasImages?: boolean
  hasNegativePrompt?: boolean
  hasNotes?: boolean
  
  // Date ranges
  createdAfter?: Date
  createdBefore?: Date
  modifiedAfter?: Date
  modifiedBefore?: Date
  
  // Generation parameters
  models?: string[]
  samplers?: string[]
  stepsMin?: number
  stepsMax?: number
  cfgMin?: number
  cfgMax?: number
  
  // Image filters
  imageTypes?: string[]
  imageCountMin?: number
  imageCountMax?: number
  
  // Template filters
  wildcardCountMin?: number
  wildcardCountMax?: number
  templateComplexity?: ('simple' | 'moderate' | 'complex')[]
  
  // Sorting
  sortBy?: 'createdAt' | 'updatedAt' | 'positivePrompt' | 'wildcardCount'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  prompt: {
    id: string
    positivePrompt: string
    negativePrompt?: string | null
    notes?: string | null
    isFavorite: boolean
    steps: number
    cfgScale: number
    sampler: string
    model: string
    seed?: bigint | null
    width: number
    height: number
    hasTemplate: boolean
    wildcardCount: number
    templateMetadata?: any
    createdAt: Date
    updatedAt: Date
    group: {
      id: string
      name: string
      libraryId: string
    }
    images: any[]
  }
  highlights?: {
    positivePrompt?: string
    negativePrompt?: string
    notes?: string
  }
  relevanceScore?: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Search suggestions for dropdowns
export interface SearchSuggestions {
  models: string[]
  samplers: string[]
  imageTypes: string[]
}