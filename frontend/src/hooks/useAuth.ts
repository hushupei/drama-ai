import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token)
        navigate('/novels', { replace: true })
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
