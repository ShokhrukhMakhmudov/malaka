import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/ui/input-password'
import { Label } from '@/components/ui/label'
import { useActionState, useEffect } from 'react'
import { loginAction } from './lib/loginAction'
import { Loader2 } from 'lucide-react'
import { Description } from '@radix-ui/react-dialog'
import { useNavigate } from '@tanstack/react-router'
import { authStore } from '@/stores/auth.store'

export function LoginDialog() {
  const navigate = useNavigate()
  const [status, formAction, isPending] = useActionState(loginAction, '')

  useEffect(() => {
    if (status === 'success') {
      navigate({ to: '/dashboard' })
    }
  }, [status])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={'lg'}
          variant="outline"
          className="bg-transparent text-xl pb-1 tracking-wide cursor-pointer dark:text-black dark:border-black text-white border-white hover:scale-105 active:scale-95"
        >
          Kirish
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Tizimga kirish</DialogTitle>
        </DialogHeader>
        <Description>
          <p className="border-b border-gray-500"></p>
        </Description>
        <form action={formAction}>
          <div className="grid gap-4">
            <div className="grid gap-3 ">
              <Label htmlFor="username-1" className="text-xl">
                Login
              </Label>
              <Input
                className="text-2xl"
                id="username-1"
                name="username"
                type="text"
                placeholder="Username"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password-1" className="text-xl">
                Parol
              </Label>
              <InputPassword
                id="password-1"
                name="password"
                placeholder="Parol"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className=" h-4 w-4 animate-spin" />}
              Kirish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
