import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useEffect } from 'react'
import { authStore } from '@/stores/auth.store'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!authStore.state.user?.isSuperAdmin) {
      navigate({ to: '/' })
    }
  })
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full bg-white">
        <SidebarTrigger />
        <section className="px-6">
          <Outlet />
        </section>
      </main>
    </SidebarProvider>
  )
}
