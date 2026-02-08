// src/pages/Dashboard/LoginHistory/LoginHistoryPage.tsx
import { useState } from 'react'
import { Crown, User2, Clock, UserCircle, RefreshCw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { trpc } from '@/utils/trpc'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/login-history')({
  component: LoginHistoryPage,
})

function LoginHistoryPage() {
  const [page, setPage] = useState(0)
  const limit = 50

  // Запрос истории входов
  const { data, isLoading, error, refetch, isFetching } =
    trpc.auth.getLoginHistory.useQuery(
      {
        limit,
        offset: page * limit,
      },
      {
        enabled: true,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 0,
      },
    )

  // Логируем ошибки для отладки
  if (error) {
    console.error('Login history error:', error)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kirish tarixi</h1>
          <p className="text-muted-foreground mt-1">
            Tizimga kirish tarixi va statistikasi
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Jami kirish: <strong>{data.total}</strong>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
              />
              Yangilash
            </Button>
          </div>
        )}
      </div>

      {/* Отображение ошибки */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
          <p className="font-medium">Xatolik yuz berdi:</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}

      <div className="border rounded-md">
        <Table className="text-lg">
          <TableHeader>
            <TableRow>
              <TableHead>Login</TableHead>
              <TableHead>Ism</TableHead>
              <TableHead>Foydalanuvchi turi</TableHead>
              <TableHead>IP manzil</TableHead>
              <TableHead>Kirish vaqti</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
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
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                </TableRow>
              ))
            ) : data && data.history.length > 0 ? (
              data.history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.login}</TableCell>
                  <TableCell>{entry.name || '-'}</TableCell>
                  <TableCell>
                    {entry.userType === 'superAdmin' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                        {entry.isMainAdmin ? (
                          <>
                            <Crown className="h-3 w-3" />
                            Asosiy admin
                          </>
                        ) : (
                          <>
                            <UserCircle className="h-3 w-3" />
                            Super admin
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        <User2 className="h-3 w-3" />
                        Foydalanuvchi
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground font-mono text-sm">
                      {entry.ipAddress || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDate(entry.loginTime)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Hech qanday kirish tarixi topilmadi
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
      {data && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Oldingi
          </Button>
          <span className="text-sm text-muted-foreground">
            Sahifa {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Keyingi
          </Button>
        </div>
      )}
    </div>
  )
}
