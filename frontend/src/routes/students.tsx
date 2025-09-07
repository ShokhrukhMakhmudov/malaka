import { createFileRoute, useNavigate } from '@tanstack/react-router'
import StudentList from '@/components/students/StudentList'
import Header from '@/components/Header'
import { useEffect } from 'react'
import { authStore } from '@/stores/auth.store'

export const Route = createFileRoute('/students')({
  component: StudentsPage,
})

function StudentsPage() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!authStore.state.isAuth) {
      navigate({ to: '/' })
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 mt-24">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Tinglovchilar ro'yxati</h1>
          </div>
          <StudentList />
        </div>
      </div>
    </div>
  )
}
