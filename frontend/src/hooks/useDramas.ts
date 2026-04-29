import { useQuery } from '@tanstack/react-query'
import { dramaApi } from '@/api/drama'
import type { PageRequest } from '@/types'

export function useDramas(params?: PageRequest & { keyword?: string }) {
  return useQuery({
    queryKey: ['dramas', params],
    queryFn: () => dramaApi.getDramas(params),
  })
}

export function useDrama(id: string) {
  return useQuery({
    queryKey: ['drama', id],
    queryFn: () => dramaApi.getDrama(id),
    enabled: !!id,
  })
}
