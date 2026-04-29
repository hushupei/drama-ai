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
  displayId: string
  title: string
  author: string
  description: string | null
  filePath: string
  status: 'UPLOADED' | 'PARSING' | 'PARSED' | 'PARSE_FAILED' | 'PROCESSING' | 'COMPLETED'
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
  createdAt: string
  updatedAt: string
}

export interface Character {
  id: string
  novelId: string
  name: string
  description: string | null
  personality: string | null
  avatarUrl: string | null
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  displayId: string
  name: string
  type: 'SINGLE_EPISODE' | 'MULTI_EPISODE' | 'SERIES'
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'PUBLISHED' | 'ARCHIVED'
  userId: string
  novelId: string
  episodes?: Episode[]
  publishedAt: string | null
  coverUrl: string | null
  totalEpisodes?: number
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
  status: 'DRAFT' | 'SCRIPT_GENERATING' | 'SCRIPT_READY' | 'VIDEO_GENERATING' | 'COMPLETED' | 'FAILED'
  failedStep?: 'script_generation' | 'video_rendering' | null
  errorMessage?: string | null
  chapter?: { title?: string } | null
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

export interface Drama {
  id: string
  name: string
  author: string
  description: string
  coverUrl: string
  episodeCount: number
  totalDuration: number
  publishedAt: string
  episodes: DramaEpisode[]
}

export interface DramaEpisode {
  id: string
  episodeNumber: number
  title: string
  duration: number
  videoUrl: string
}

export interface BatchOperationResponse {
  totalRequested: number
  succeeded: number
  failed: number
  results: BatchResult[]
}

export interface BatchResult {
  episodeId: string
  episodeNumber: number
  status: 'SUCCESS' | 'FAILURE'
  taskId?: string
  error?: string
}

export interface ChapterWithSelection extends Chapter {
  included: boolean
}
