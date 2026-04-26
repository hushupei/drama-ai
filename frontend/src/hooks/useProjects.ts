import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectApi } from '@/api'
import type { PageRequest } from '@/types'

export function useProjects(params?: PageRequest) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const response = await projectApi.getProjects(params)
      return response.success ? response.data : []
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await projectApi.getProject(id)
      return response.success ? response.data : null
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useEpisodes(projectId: string, params?: PageRequest) {
  return useQuery({
    queryKey: ['episodes', projectId, params],
    queryFn: async () => {
      const response = await projectApi.getEpisodes(projectId, params)
      return response.success ? response.data : []
    },
    enabled: !!projectId,
  })
}
