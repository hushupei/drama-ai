import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { characterApi, type CreateCharacterRequest, type UpdateCharacterRequest } from '@/api/character'
import type { Character } from '@/types'

const CHARACTERS_KEY = 'characters'

export function useCharacters(novelId: string) {
  return useQuery({
    queryKey: [CHARACTERS_KEY, novelId],
    queryFn: async () => {
      const response = await characterApi.getCharacters(novelId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch characters')
      }
      return response.data || []
    },
    enabled: !!novelId,
  })
}

export function useCharacter(novelId: string, characterId: string) {
  return useQuery({
    queryKey: [CHARACTERS_KEY, novelId, characterId],
    queryFn: async () => {
      const response = await characterApi.getCharacter(novelId, characterId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch character')
      }
      return response.data
    },
    enabled: !!novelId && !!characterId,
  })
}

export function useCreateCharacter(novelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCharacterRequest) => {
      const response = await characterApi.createCharacter(novelId, data)
      if (!response.success) {
        throw new Error(response.error || 'Failed to create character')
      }
      return response.data as Character
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHARACTERS_KEY, novelId] })
    },
  })
}

export function useUpdateCharacter(novelId: string, characterId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateCharacterRequest) => {
      const response = await characterApi.updateCharacter(novelId, characterId, data)
      if (!response.success) {
        throw new Error(response.error || 'Failed to update character')
      }
      return response.data as Character
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHARACTERS_KEY, novelId] })
      queryClient.invalidateQueries({ queryKey: [CHARACTERS_KEY, novelId, characterId] })
    },
  })
}

export function useDeleteCharacter(novelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (characterId: string) => {
      const response = await characterApi.deleteCharacter(novelId, characterId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete character')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHARACTERS_KEY, novelId] })
    },
  })
}

export function useConfirmCharacter(novelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (characterId: string) => {
      const response = await characterApi.confirmCharacter(novelId, characterId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to confirm character')
      }
      return response.data as Character
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHARACTERS_KEY, novelId] })
    },
  })
}
