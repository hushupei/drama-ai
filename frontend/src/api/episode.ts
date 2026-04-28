import apiClient, { aiClient } from './client'
import type { Episode, ApiResponse, PageRequest } from '@/types'

export interface CreateEpisodeRequest {
  projectId: string
  title: string
  episodeNumber: number
  chapterIds?: string[]
}

export interface UpdateEpisodeRequest {
  title?: string
  scriptContent?: string
  videoUrl?: string
  duration?: number
  status?: 'PENDING' | 'GENERATING_SCRIPT' | 'GENERATING_SCENES' | 'GENERATING_AUDIO' | 'RENDERING_VIDEO' | 'COMPLETED' | 'FAILED'
}

export interface GenerateScriptRequest {
  chapter_id: string
  episode_id: string
  project_id: string
  novel_id: string
  style: 'dialogue' | 'narrative' | 'mixed'
  character_count: number
}

export interface RenderVideoRequest {
  script_id: string
  episode_id: string
  project_id: string
  resolution: '720p' | '1080p' | '4k'
  duration_target: number
}

export const episodeApi = {
  getEpisodes: async (projectId: string, params?: PageRequest): Promise<ApiResponse<Episode[]>> => {
    const response = await apiClient.get(`/projects/${projectId}/episodes`, { params })
    return response.data
  },

  getEpisode: async (projectId: string, id: string): Promise<ApiResponse<Episode>> => {
    const response = await apiClient.get(`/projects/${projectId}/episodes/${id}`)
    return response.data
  },

  createEpisode: async (projectId: string, data: CreateEpisodeRequest): Promise<ApiResponse<Episode>> => {
    const response = await apiClient.post(`/projects/${projectId}/episodes`, data)
    return response.data
  },

  updateEpisode: async (projectId: string, id: string, data: UpdateEpisodeRequest): Promise<ApiResponse<Episode>> => {
    const response = await apiClient.put(`/projects/${projectId}/episodes/${id}`, data)
    return response.data
  },

  deleteEpisode: async (projectId: string, id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/projects/${projectId}/episodes/${id}`)
    return response.data
  },

  generateScript: async (data: GenerateScriptRequest): Promise<{ task_id: string; status: string; message: string }> => {
    const response = await aiClient.post('/tasks/generate', data)
    return response.data
  },

  renderVideo: async (data: RenderVideoRequest): Promise<{ task_id: string; status: string; message: string }> => {
    const response = await aiClient.post('/tasks/render', data)
    return response.data
  },

  previewVideo: (videoUrl: string): string => {
    if (!videoUrl) return ''
    if (videoUrl.startsWith('http')) return videoUrl
    return `/media/drama-files/${videoUrl}`
  },
}
