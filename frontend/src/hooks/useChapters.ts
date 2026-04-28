import { useQuery } from '@tanstack/react-query'
import { chapterApi } from '@/api/chapter'

const CHAPTERS_KEY = 'chapters'

export function useChapters(novelId: string) {
  return useQuery({
    queryKey: [CHAPTERS_KEY, novelId],
    queryFn: async () => {
      const response = await chapterApi.getChapters(novelId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch chapters')
      }
      return response.data || []
    },
    enabled: !!novelId,
  })
}
