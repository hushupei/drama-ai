export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface Novel {
  id: string
  title: string
  author: string
  summary: string | null
  storagePath: string
  status: 'uploaded' | 'parsing' | 'parsed' | 'generating' | 'completed' | 'failed'
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Chapter {
  id: string
  novelId: string
  chapterNumber: number
  title: string | null
  content: string | null
  summary: string | null
  createdAt: string
  updatedAt: string
}

export interface Character {
  id: string
  novelId: string
  name: string
  description: string | null
  personalityTags: string[] | null
  avatarUrl: string | null
  status: 'draft' | 'confirmed'
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  type: 'episode' | 'series'
  status: 'draft' | 'in_progress' | 'completed' | 'archived'
  userId: string
  novelId: string
  createdAt: string
  updatedAt: string
}

export interface Episode {
  id: string
  projectId: string
  title: string
  episodeNumber: number
  scriptContent: string | null
  videoUrl: string | null
  duration: number | null
  status: 'pending' | 'script_generated' | 'rendering' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export interface PageRequest {
  page?: number
  size?: number
  sort?: string
}

export interface Page<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      sorted: boolean
      unsorted: boolean
      empty: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  totalPages: number
  totalElements: number
  last: boolean
  first: boolean
  size: number
  number: number
  sort: {
    sorted: boolean
    unsorted: boolean
    empty: boolean
  }
  numberOfElements: number
  empty: boolean
}
