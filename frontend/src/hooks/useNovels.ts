import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { novelApi } from '@/api'
import type { PageRequest } from '@/types'

export function useNovels(params?: PageRequest) {
  return useQuery({
    queryKey: ['novels', params],
    queryFn: async () => {
      const response = await novelApi.getNovels(params)
      return response.success && response.data ? response.data.content : []
    },
  })
}

export function useNovel(id: string) {
  return useQuery({
    queryKey: ['novel', id],
    queryFn: async () => {
      const response = await novelApi.getNovel(id)
      return response.success ? response.data : null
    },
    enabled: !!id,
  })
}

export function useCreateNovel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: novelApi.createNovel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels'], exact: false })
    },
  })
}

export function useDeleteNovel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: novelApi.deleteNovel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels'], exact: false })
    },
  })
}
