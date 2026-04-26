import apiClient from './client'
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
  status?: 'pending' | 'script_generated' | 'rendering' | 'completed' | 'failed'
}

export interface GenerateScriptRequest {
  chapterIds: string[]
  characterIds?: string[]
  style?: 'dramatic' | 'comedy' | 'suspense' | 'romantic'
  duration?: number
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

  generateScript: async (projectId: string, id: string, data: GenerateScriptRequest): Promise<ApiResponse<Episode>> => {
    const response = await apiClient.post(`/projects/${projectId}/episodes/${id}/generate-script`, data)
    return response.data
  },

  renderVideo: async (projectId: string, id: string): Promise<ApiResponse<Episode>> => {
    const response = await apiClient.post(`/projects/${projectId}/episodes/${id}/render`)
    return response.data
  },

  previewVideo: (projectId: string, id: string): string => {
    return `${apiClient.defaults.baseURL}/projects/${projectId}/episodes/${id}/preview`
  },
}
