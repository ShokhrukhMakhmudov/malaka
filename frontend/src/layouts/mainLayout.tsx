import { Toaster } from '@/components/ui/sonner'
import { authStore } from '@/stores/auth.store'
import { trpc } from '@/utils/trpc'
import { Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

function MainLayout() {
  const [token, setToken] = useState<string | null>(null)

  // Считываем токен один раз при монтировании
  useEffect(() => {
    setToken(localStorage.getItem('token'))
  }, [])

  // Запрос выполняется только если токен есть
  const { data } = trpc.auth.authWithToken.useQuery(undefined, {
    enabled: !!token, // включаем запрос только если токен не пустой
  }) as any

  if (data?.success && data.token) {
    localStorage.setItem('token', data.token)

    authStore.setState((state) => ({
      ...state,
      isAuth: true,
      user: data.user,
    }))
  } else {
    authStore.setState((state) => ({
      ...state,
      isAuth: false,
    }))
  }

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}

export default MainLayout
