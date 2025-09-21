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

  console.log('Client token:', token)

  // Запрос выполняется только если токен есть
  const { data, isPending } = trpc.auth.authWithToken.useQuery(undefined, {
    enabled: !!token, // включаем запрос только если токен не пустой
  }) as any
  console.log('Data:', data)

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

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <svg
          className="size-24 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    )
  }
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}

export default MainLayout
