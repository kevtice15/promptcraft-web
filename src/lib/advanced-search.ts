import { prisma } from './prisma'
import { SearchFilters, SearchResult, SearchResponse } from '@/types/search'
import { Prisma } from '@prisma/client'

export async function executeAdvancedSearch(
  userId: string,
  libraryId: string,
  filters: SearchFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResponse> {
  const skip = (page - 1) * pageSize
  
  // Build the where clause
  const whereClause: Prisma.PromptWhereInput = {
    group: {
      library: {
        ownerId: userId,
        id: libraryId
      }
    }
  }

  // Apply filters
  if (filters.query) {
    // Simple text search across multiple fields
    const query = filters.query.toLowerCase()
    whereClause.OR = [
      { positivePrompt: { contains: query, mode: 'insensitive' } },
      { negativePrompt: { contains: query, mode: 'insensitive' } },
      { notes: { contains: query, mode: 'insensitive' } },
      { group: { name: { contains: query, mode: 'insensitive' } } }
    ]
  }

  if (filters.favoritesOnly) {
    whereClause.isFavorite = true
  }

  if (filters.templatesOnly) {
    whereClause.hasTemplate = true
  }

  if (filters.hasImages) {
    whereClause.images = {
      some: {}
    }
  }

  if (filters.hasNegativePrompt) {
    whereClause.negativePrompt = {
      not: null
    }
  }

  if (filters.hasNotes) {
    whereClause.notes = {
      not: null
    }
  }

  // Date filters
  if (filters.createdAfter || filters.createdBefore) {
    whereClause.createdAt = {}
    if (filters.createdAfter) {
      whereClause.createdAt.gte = filters.createdAfter
    }
    if (filters.createdBefore) {
      whereClause.createdAt.lte = filters.createdBefore
    }
  }

  if (filters.modifiedAfter || filters.modifiedBefore) {
    whereClause.updatedAt = {}
    if (filters.modifiedAfter) {
      whereClause.updatedAt.gte = filters.modifiedAfter
    }
    if (filters.modifiedBefore) {
      whereClause.updatedAt.lte = filters.modifiedBefore
    }
  }

  // Parameter filters
  if (filters.models && filters.models.length > 0) {
    whereClause.model = {
      in: filters.models
    }
  }

  if (filters.samplers && filters.samplers.length > 0) {
    whereClause.sampler = {
      in: filters.samplers
    }
  }

  if (filters.stepsMin !== undefined || filters.stepsMax !== undefined) {
    whereClause.steps = {}
    if (filters.stepsMin !== undefined) {
      whereClause.steps.gte = filters.stepsMin
    }
    if (filters.stepsMax !== undefined) {
      whereClause.steps.lte = filters.stepsMax
    }
  }

  if (filters.cfgMin !== undefined || filters.cfgMax !== undefined) {
    whereClause.cfgScale = {}
    if (filters.cfgMin !== undefined) {
      whereClause.cfgScale.gte = filters.cfgMin
    }
    if (filters.cfgMax !== undefined) {
      whereClause.cfgScale.lte = filters.cfgMax
    }
  }

  // Image filters
  if (filters.imageTypes && filters.imageTypes.length > 0) {
    whereClause.images = {
      some: {
        type: {
          in: filters.imageTypes
        }
      }
    }
  }

  if (filters.imageCountMin !== undefined || filters.imageCountMax !== undefined) {
    // This requires a more complex query using _count
    const imageCountFilter: any = {}
    if (filters.imageCountMin !== undefined) {
      imageCountFilter.gte = filters.imageCountMin
    }
    if (filters.imageCountMax !== undefined) {
      imageCountFilter.lte = filters.imageCountMax
    }
    
    // We'll handle this in the actual query by using a separate count check
  }

  // Template filters
  if (filters.wildcardCountMin !== undefined || filters.wildcardCountMax !== undefined) {
    whereClause.wildcardCount = {}
    if (filters.wildcardCountMin !== undefined) {
      whereClause.wildcardCount.gte = filters.wildcardCountMin
    }
    if (filters.wildcardCountMax !== undefined) {
      whereClause.wildcardCount.lte = filters.wildcardCountMax
    }
  }

  if (filters.templateComplexity && filters.templateComplexity.length > 0) {
    // Filter by complexity stored in templateMetadata
    const complexityConditions = filters.templateComplexity.map(complexity => ({
      templateMetadata: {
        path: ['complexity'],
        equals: complexity
      }
    }))
    
    if (whereClause.OR) {
      whereClause.AND = [
        { OR: whereClause.OR },
        { OR: complexityConditions }
      ]
      delete whereClause.OR
    } else {
      whereClause.OR = complexityConditions
    }
  }

  // Build order by clause
  const orderBy: Prisma.PromptOrderByWithRelationInput = {}
  if (filters.sortBy) {
    const sortField = filters.sortBy
    const sortOrder = filters.sortOrder || 'desc'
    orderBy[sortField] = sortOrder
  } else {
    orderBy.createdAt = 'desc'
  }

  try {
    // Execute the search query
    const [prompts, totalCount] = await Promise.all([
      prisma.prompt.findMany({
        where: whereClause,
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
        orderBy,
        skip,
        take: pageSize
      }),
      prisma.prompt.count({
        where: whereClause
      })
    ])

    // Process results and add highlights
    const results: SearchResult[] = prompts.map(prompt => {
      const result: SearchResult = {
        prompt: {
          ...prompt,
          createdAt: prompt.createdAt,
          updatedAt: prompt.updatedAt
        }
      }

      // Add highlights if there's a text query
      if (filters.query) {
        result.highlights = generateHighlights(prompt, filters.query)
      }

      return result
    })

    const totalPages = Math.ceil(totalCount / pageSize)

    return {
      results,
      total: totalCount,
      page,
      pageSize,
      totalPages
    }

  } catch (error) {
    console.error('Advanced search error:', error)
    throw new Error('Search failed')
  }
}

function generateHighlights(prompt: any, query: string): any {
  const highlights: any = {}
  const queryLower = query.toLowerCase()

  // Simple highlighting - wrap matches in <mark> tags
  const highlightText = (text: string | null) => {
    if (!text) return null
    
    const regex = new RegExp(`(${escapeRegExp(queryLower)})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  if (prompt.positivePrompt?.toLowerCase().includes(queryLower)) {
    highlights.positivePrompt = highlightText(prompt.positivePrompt)
  }

  if (prompt.negativePrompt?.toLowerCase().includes(queryLower)) {
    highlights.negativePrompt = highlightText(prompt.negativePrompt)
  }

  if (prompt.notes?.toLowerCase().includes(queryLower)) {
    highlights.notes = highlightText(prompt.notes)
  }

  return Object.keys(highlights).length > 0 ? highlights : undefined
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function getSearchSuggestions(
  userId: string,
  libraryId: string
): Promise<{ models: string[], samplers: string[], imageTypes: string[] }> {
  try {
    const [modelsResult, samplersResult, imageTypesResult] = await Promise.all([
      prisma.prompt.findMany({
        where: {
          group: {
            library: {
              ownerId: userId,
              id: libraryId
            }
          }
        },
        select: { model: true },
        distinct: ['model']
      }),
      prisma.prompt.findMany({
        where: {
          group: {
            library: {
              ownerId: userId,
              id: libraryId
            }
          }
        },
        select: { sampler: true },
        distinct: ['sampler']
      }),
      prisma.imageReference.findMany({
        where: {
          prompt: {
            group: {
              library: {
                ownerId: userId,
                id: libraryId
              }
            }
          }
        },
        select: { type: true },
        distinct: ['type']
      })
    ])

    return {
      models: modelsResult.map(r => r.model).filter(Boolean),
      samplers: samplersResult.map(r => r.sampler).filter(Boolean),
      imageTypes: imageTypesResult.map(r => r.type).filter(Boolean)
    }
  } catch (error) {
    console.error('Failed to get search suggestions:', error)
    return { models: [], samplers: [], imageTypes: [] }
  }
}