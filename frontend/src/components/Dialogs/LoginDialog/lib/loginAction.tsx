import { toast } from 'sonner'
import { CircleCheckBig, XCircle } from 'lucide-react'
import { authStore } from '@/stores/auth.store'
import { baseUrl } from '@/lib/api'

export async function loginAction(_: string, userData: FormData) {
  if (!userData.get('username') || !userData.get('password')) return 'error'

  const sendData = {
    login: userData.get('username'),
    password: userData.get('password'),
  }

  try {
    const req = await fetch(baseUrl + '/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendData),
    })

    const res = await req.json()

    if (!req.ok) throw new Error(res.error)

    authStore.setState((state) => ({
      ...state,
      isAuth: true,
      user: res.user,
    }))

    localStorage.setItem('token', res.token)
  } catch (error) {
    toast((error as Error).message, {
      duration: 3000,
      position: 'top-center',
      icon: <XCircle className="text-red-500 w-7 h-7 pe-2" />,
      style: {
        width: 'fit-content',
        background: 'white',
        color: 'black',
        border: '3px solid #fb2c36',
        fontSize: '18px',
      },
    })
    return 'error'
  }

  toast('Siz tizimga muvaffaqiyatli kirdingiz!', {
    duration: 3000,
    position: 'top-center',
    icon: <CircleCheckBig className="text-green-500 w-7 h-7 pe-2" />,
    style: {
      width: 'fit-content',
      background: 'white',
      color: 'black',
      border: '3px solid #00c951',
      fontSize: '18px',
    },
  })

  return 'success'
}
