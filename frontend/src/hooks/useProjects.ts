import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectApi } from '@/api'
import type { PageRequest } from '@/types'

export function useProjects(params?: PageRequest) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const response = await projectApi.getProjects(params)
      if (response.success && response.data) {
        return {
          content: response.data.content,
          total: response.data.totalElements,
          page: response.data.number,
          size: response.data.size,
        }
      }
      return { content: [], total: 0, page: 0, size: 10 }
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
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false })
    },
  })
}

export function usePublishProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, coverUrl }: { id: string; coverUrl?: string }) =>
      projectApi.publishProject(id, coverUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
