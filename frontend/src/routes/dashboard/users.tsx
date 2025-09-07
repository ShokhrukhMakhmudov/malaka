// src/pages/Dashboard/Users/UsersPage.tsx
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/utils/trpc'
import { toast } from 'sonner'
import { createFileRoute } from '@tanstack/react-router'
import type { Role } from '@malaka/backend/src/server/routers/auth.router'

export const Route = createFileRoute('/dashboard/users')({
  component: UsersPage,
})

function UsersPage() {
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Запрос списка пользователей
  const { data: users, isLoading, refetch } = trpc.auth.listUsers.useQuery()

  // Мутации для управления пользователями
  const createUser = trpc.auth.createUser.useMutation()
  const updateUser = trpc.auth.updateUser.useMutation()
  const deleteUser = trpc.auth.deleteUser.useMutation()

  // Состояния для формы
  const [login, setLogin] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState<Role[]>([])

  // Обработчик создания пользователя
  const handleCreateUser = async () => {
    try {
      await createUser.mutateAsync({
        login,
        password,
        name,
        roles,
      })

      toast('Foydalanuvchi muvaffaqiyatli yaratildi', {
        icon: <Plus className="text-green-500" />,
        position: 'top-center',
      })

      setIsCreateDialogOpen(false)
      resetForm()
      refetch()
      queryClient.invalidateQueries({ queryKey: ['auth.listUsers'] })
    } catch (error) {
      toast('Ошибка при создании пользователя', {
        icon: <Trash2 className="text-red-500" />,
        position: 'top-center',
      })
    }
  }

  // Обработчик обновления пользователя
  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        login,
        name,
        password: password || undefined,
        roles,
      })

      toast('Foydalanuvchi muvaffaqiyatli yangilandi', {
        icon: <Pencil className="text-green-500" />,
        position: 'top-center',
      })

      setIsEditDialogOpen(false)
      resetForm()
      refetch()
      queryClient.invalidateQueries({ queryKey: ['auth.listUsers'] })
    } catch (error) {
      toast('Ошибка при обновлении пользователя', {
        icon: <Trash2 className="text-red-500" />,
        position: 'top-center',
      })
    }
  }

  // Обработчик удаления пользователя
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      await deleteUser.mutateAsync({ id: selectedUser.id })

      toast("Foydalanuvchi muvaffaqiyatli o'chirildi", {
        icon: <Trash2 className="text-green-500" />,
        position: 'top-center',
      })

      setIsDeleteDialogOpen(false)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['auth.listUsers'] })
    } catch (error) {
      toast('Ошибка при удалении пользователя', {
        icon: <Trash2 className="text-red-500" />,
        position: 'top-center',
      })
    }
  }

  // Сброс формы
  const resetForm = () => {
    setLogin('')
    setName('')
    setPassword('')
    setRoles([])
    setSelectedUser(null)
  }

  // Обработчик выбора роли
  const handleRoleChange = (role: Role) => {
    if (roles.includes(role)) {
      setRoles(roles.filter((r) => r !== role))
    } else {
      setRoles([...roles, role])
    }
  }

  // Открытие диалога редактирования
  const openEditDialog = (user: any) => {
    setSelectedUser(user)
    setLogin(user.login)
    setName(user.name || '')
    setPassword('')
    setRoles(user.roles)
    setIsEditDialogOpen(true)
  }

  // Открытие диалога удаления
  const openDeleteDialog = (user: any) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  // Список всех возможных ролей
  const allRoles: Role[] = ['READ', 'EDIT', 'CREATE', 'COURSE_MANAGEMENT']

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>

        {/* Диалог создания пользователя */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="h-4 w-4" />
              Qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi foydalanuvchi qo'shish</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="login">Login</Label>
                <Input
                  id="login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Ism</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Imkoniyatlar</Label>
                <div className="grid grid-cols-2 gap-2">
                  {allRoles.map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={roles.includes(role)}
                        onCheckedChange={() => handleRoleChange(role)}
                      />
                      <label
                        htmlFor={`role-${role}`}
                        className="text-sm font-medium leading-none"
                      >
                        {role}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button onClick={handleCreateUser}>Yaratish</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Таблица пользователей */}
      <div className="border rounded-md">
        <Table className="text-xl">
          <TableHeader>
            <TableRow>
              <TableHead>Login</TableHead>
              <TableHead>Ism</TableHead>
              <TableHead>Imkoniyatlar</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Скелетоны загрузки
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-64" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.login}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Диалог редактирования пользователя */}
                      <Dialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Tahrirlash</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="login">Login</Label>
                              <Input
                                id="login"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="name">Ism</Label>
                              <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="password">
                                Yangi parol (o'zgartirmaslik uchun bo'sh
                                qoldiring)
                              </Label>
                              <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Imkoniyatlar</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {allRoles.map((role) => (
                                  <div
                                    key={role}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`role-${role}`}
                                      checked={roles.includes(role)}
                                      onCheckedChange={() =>
                                        handleRoleChange(role)
                                      }
                                    />
                                    <label
                                      htmlFor={`role-${role}`}
                                      className="text-sm font-medium leading-none"
                                    >
                                      {role}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsEditDialogOpen(false)}
                            >
                              Bekoq qilish
                            </Button>
                            <Button onClick={handleUpdateUser}>Saqlash</Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Диалог удаления пользователя */}
                      <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Это действие нельзя отменить. Пользователь{' '}
                              <strong>{selectedUser?.login}</strong> будет
                              удалён.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={handleDeleteUser}
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Foydalanuvchilar topilmadi!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
