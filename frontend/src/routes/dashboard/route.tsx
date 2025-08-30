import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
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
