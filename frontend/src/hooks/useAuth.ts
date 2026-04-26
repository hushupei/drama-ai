import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores'

export function useLogin() {
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token)
      }
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token)
      }
    },
  })
}
