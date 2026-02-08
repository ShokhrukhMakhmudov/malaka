// src/pages/Dashboard/SuperAdmins/SuperAdminsPage.tsx
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Crown } from 'lucide-react'
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
// import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/utils/trpc'
import { toast } from 'sonner'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/superadmins')({
  component: SuperAdminsPage,
})

function SuperAdminsPage() {
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null)

  // Запрос списка супер-админов
  const {
    data: superAdmins,
    isLoading,
    refetch,
  } = trpc.auth.listSuperAdmins.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  })

  // Мутации для управления супер-админами
  const createSuperAdmin = trpc.auth.createSuperAdminByMain.useMutation()
  const updateSuperAdmin = trpc.auth.updateSuperAdmin.useMutation()
  const deleteSuperAdmin = trpc.auth.deleteSuperAdmin.useMutation()

  // Состояния для формы
  const [login, setLogin] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isMainAdmin, setIsMainAdmin] = useState(false)

  // Обработчик создания супер-админа
  const handleCreateSuperAdmin = async () => {
    try {
      await createSuperAdmin.mutateAsync({
        login,
        password,
        name,
        isMainAdmin,
      })

      toast('Super admin muvaffaqiyatli yaratildi', {
        icon: <Plus className="text-green-500" />,
        position: 'top-center',
      })

      setIsCreateDialogOpen(false)
      resetForm()
      refetch()
      queryClient.invalidateQueries({ queryKey: ['auth.listSuperAdmins'] })
    } catch (error: any) {
      toast(error.message || 'Ошибка при создании super admin', {
        icon: <Trash2 className="text-red-500" />,
        position: 'top-center',
      })
    }
  }

  // Обработчик обновления супер-админа
  const handleUpdateSuperAdmin = async () => {
    if (!selectedAdmin) return

    try {
      await updateSuperAdmin.mutateAsync({
        id: selectedAdmin.id,
        login,
        name,
        password: password || undefined,
        isMainAdmin,
      })

      toast('Super admin muvaffaqiyatli yangilandi', {
        icon: <Pencil className="text-green-500" />,
        position: 'top-center',
      })

      setIsEditDialogOpen(false)
      resetForm()
      refetch()
      queryClient.invalidateQueries({ queryKey: ['auth.listSuperAdmins'] })
    } catch (error: any) {
      toast(error.message || 'Ошибка при обновлении super admin', {
        icon: <Trash2 className="text-red-500" />,
        position: 'top-center',
      })
    }
  }

  // Обработчик удаления супер-админа
  const handleDeleteSuperAdmin = async () => {
    if (!selectedAdmin) return

    try {
      await deleteSuperAdmin.mutateAsync({ id: selectedAdmin.id })

      toast("Super admin muvaffaqiyatli o'chirildi", {
        icon: <Trash2 className="text-green-500" />,
        position: 'top-center',
      })

      setIsDeleteDialogOpen(false)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['auth.listSuperAdmins'] })
    } catch (error: any) {
      toast(error.message || 'Ошибка при удалении super admin', {
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
    setIsMainAdmin(false)
    setSelectedAdmin(null)
  }

  // Открытие диалога редактирования
  const openEditDialog = (admin: any) => {
    setSelectedAdmin(admin)
    setLogin(admin.login)
    setName(admin.name || '')
    setPassword('')
    setIsMainAdmin(admin.isMainAdmin)
    setIsEditDialogOpen(true)
  }

  // Открытие диалога удаления
  const openDeleteDialog = (admin: any) => {
    setSelectedAdmin(admin)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Super Adminlar</h1>

        {/* Диалог создания супер-админа */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="h-4 w-4" />
              Qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi super admin qo'shish</DialogTitle>
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

              {/* <div className="flex items-center space-x-2">
                <Checkbox
                  id="isMainAdmin"
                  checked={isMainAdmin}
                  onCheckedChange={(checked) => setIsMainAdmin(checked as boolean)}
                />
                <label
                  htmlFor="isMainAdmin"
                  className="text-sm font-medium leading-none flex items-center gap-2"
                >
                  <Crown className="h-4 w-4 text-yellow-500" />
                  Asosiy administrator
                </label>
              </div> */}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button onClick={handleCreateSuperAdmin}>Yaratish</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Таблица супер-админов */}
      <div className="border rounded-md">
        <Table className="text-xl">
          <TableHeader>
            <TableRow>
              <TableHead>Login</TableHead>
              <TableHead>Ism</TableHead>
              <TableHead>Status</TableHead>
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
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : superAdmins && superAdmins.length > 0 ? (
              superAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.login}</TableCell>
                  <TableCell>{admin.name || '-'}</TableCell>
                  <TableCell>
                    {admin.isMainAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                        <Crown className="h-3 w-3" />
                        Asosiy admin
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                        Super admin
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Диалог редактирования супер-админа */}
                      <Dialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(admin)}
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
                              <Label htmlFor="edit-login">Login</Label>
                              <Input
                                id="edit-login"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Ism</Label>
                              <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-password">
                                Yangi parol (o'zgartirmaslik uchun bo'sh
                                qoldiring)
                              </Label>
                              <Input
                                id="edit-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                            </div>

                            {/* <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-isMainAdmin"
                                checked={isMainAdmin}
                                onCheckedChange={(checked) =>
                                  setIsMainAdmin(checked as boolean)
                                }
                              />
                              <label
                                htmlFor="edit-isMainAdmin"
                                className="text-sm font-medium leading-none flex items-center gap-2"
                              >
                                <Crown className="h-4 w-4 text-yellow-500" />
                                Asosiy administrator
                              </label>
                            </div> */}
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsEditDialogOpen(false)}
                            >
                              Bekor qilish
                            </Button>
                            <Button onClick={handleUpdateSuperAdmin}>
                              Saqlash
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Диалог удаления супер-админа */}
                      <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(admin)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Ishonchingiz komilmi?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu amalni bekor qilib bo'lmaydi. Super admin{' '}
                              <strong>{selectedAdmin?.login}</strong>{' '}
                              o'chiriladi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={handleDeleteSuperAdmin}
                            >
                              O'chirish
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
                  Super adminlar topilmadi!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
