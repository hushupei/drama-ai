import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { episodeApi, type CreateEpisodeRequest, type UpdateEpisodeRequest, type GenerateScriptRequest } from '@/api/episode'
import type { Episode } from '@/types'

const EPISODES_KEY = 'episodes'

export function useEpisodes(projectId: string) {
  return useQuery({
    queryKey: [EPISODES_KEY, projectId],
    queryFn: async () => {
      const response = await episodeApi.getEpisodes(projectId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch episodes')
      }
      return response.data || []
    },
    enabled: !!projectId,
  })
}

export function useEpisode(projectId: string, episodeId: string) {
  return useQuery({
    queryKey: [EPISODES_KEY, projectId, episodeId],
    queryFn: async () => {
      const response = await episodeApi.getEpisode(projectId, episodeId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch episode')
      }
      return response.data
    },
    enabled: !!projectId && !!episodeId,
  })
}

export function useCreateEpisode(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateEpisodeRequest) => {
      const response = await episodeApi.createEpisode(projectId, data)
      if (!response.success) {
        throw new Error(response.error || 'Failed to create episode')
      }
      return response.data as Episode
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EPISODES_KEY, projectId] })
    },
  })
}

export function useUpdateEpisode(projectId: string, episodeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateEpisodeRequest) => {
      const response = await episodeApi.updateEpisode(projectId, episodeId, data)
      if (!response.success) {
        throw new Error(response.error || 'Failed to update episode')
      }
      return response.data as Episode
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EPISODES_KEY, projectId] })
      queryClient.invalidateQueries({ queryKey: [EPISODES_KEY, projectId, episodeId] })
    },
  })
}

export function useDeleteEpisode(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (episodeId: string) => {
      const response = await episodeApi.deleteEpisode(projectId, episodeId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete episode')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EPISODES_KEY, projectId] })
    },
  })
}

export function useGenerateScript(projectId: string, episodeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: GenerateScriptRequest) => {
      const response = await episodeApi.generateScript(projectId, episodeId, data)
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate script')
      }
      return response.data as Episode
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EPISODES_KEY, projectId] })
      queryClient.invalidateQueries({ queryKey: [EPISODES_KEY, projectId, episodeId] })
    },
  })
}

export function useRenderVideo(projectId: string, episodeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await episodeApi.renderVideo(projectId, episodeId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to render video')
      }
      return response.data as Episode
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EPISODES_KEY, projectId] })
      queryClient.invalidateQueries({ queryKey: [EPISODES_KEY, projectId, episodeId] })
    },
  })
}

export function useVideoPreviewUrl(projectId: string, episodeId: string): string {
  return episodeApi.previewVideo(projectId, episodeId)
}
