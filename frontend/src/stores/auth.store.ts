import { Store } from '@tanstack/store'

interface AuthStore {
  isAuth: boolean
  user: {
    id: string
    login: string
    name: string
    roles?: string[]
    isSuperAdmin: boolean
  }
}

export const authStore = new Store<AuthStore>({
  isAuth: false,
  user: {
    id: '',
    login: '',
    name: '',
    isSuperAdmin: false,
  },
})
