import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authStore } from '@/stores/auth.store'

const UserDropdown = () => {
  const handleLogout = () => {
    window.location.reload()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="border px-3 rounded-lg bg-transparent text-xl pb-2 pt-1 tracking-wide cursor-pointer dark:text-black dark:border-black text-white border-white hover:scale-105 active:scale-95 transition-transform duration-200">
          {authStore.state?.user.name}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-32 z-[100]">
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-center text-xl text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          Chiqish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown
