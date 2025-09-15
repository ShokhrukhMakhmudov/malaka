import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { authStore } from '@/stores/auth.store'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  GraduationCap,
  Home,
  SquareUser,
  BookText,
  User2,
  LibraryBig,
  DoorOpen,
  LayoutDashboard,
} from 'lucide-react'
// Menu items.
const items = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Bosh sahifa',
    url: '/',
    icon: Home,
  },
  {
    title: 'Tinglovchilar',
    url: '/dashboard/students',
    icon: SquareUser,
  },
  {
    title: 'Sertifikatlar',
    url: '/dashboard/certificates/generate',
    icon: GraduationCap,
  },
  {
    title: 'Kurslar',
    url: '/dashboard/courses',
    icon: LibraryBig,
  },
  {
    title: 'Imtihon natijalari',
    url: '/dashboard/courses/results',
    icon: BookText,
  },
]
export function AppSidebar() {
  const state = useRouterState({
    select(state) {
      return state.location.pathname
    },
  })

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="logo flex items-center gap-3">
          <img
            src="/logo.png"
            alt="logo"
            className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px]"
            width={60}
            height={60}
          />
          <p className="font-semibold text-primary text-[12px] ">
            ICHKI ISHLAR VAZIRLIGI <br /> MALAKA OSHIRISH INSTITUTI
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size={'lg'}
                    className="text-2xl "
                    isActive={state === item.url}
                  >
                    <Link to={item.url} className="gap-3 justify-stretch">
                      <item.icon
                        style={{
                          width: '24px',
                          height: '24px',
                          marginTop: '1px',
                        }}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem key={'users'}>
                <SidebarMenuButton
                  asChild
                  size={'lg'}
                  className="text-2xl "
                  isActive={state === '/dashboard/users'}
                >
                  <Link
                    to={'/dashboard/users'}
                    className="gap-3 justify-stretch"
                  >
                    <User2
                      style={{
                        width: '24px',
                        height: '24px',
                        marginTop: '1px',
                      }}
                    />
                    <span>Foydalanuvchilar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem key={'exit'}>
                <SidebarMenuButton asChild size={'lg'} className="text-2xl ">
                  <Link
                    to={'/'}
                    className="gap-3 justify-stretch"
                    onClick={() =>
                      authStore.setState({
                        isAuth: false,
                        user: {
                          id: '',
                          login: '',
                          name: '',
                          isSuperAdmin: false,
                        },
                      })
                    }
                  >
                    <DoorOpen
                      style={{
                        width: '24px',
                        height: '24px',
                        marginTop: '1px',
                      }}
                    />
                    <span>Chiqish</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
