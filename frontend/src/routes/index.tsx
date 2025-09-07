import Header from '@/components/Header'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@/utils/trpc'
import Stats from '@/components/stats'

export const Route = createFileRoute('/')({
  component: Home,
})

export default function Home() {
  // Загрузка данных статистики
  const studentCountQuery = trpc.dashboard.getStudentCount.useQuery()

  // Расчет общей статистики
  const totalStudents = studentCountQuery.data?.totalStudents || 0
  const totalCourses = studentCountQuery.data?.totalCourses || 0
  const activeCourses = studentCountQuery.data?.activeCourses || 0
  const passedExams = studentCountQuery.data?.passedExams || 0

  // Расчет процента успешной сдачи экзаменов
  const passRate =
    totalStudents > 0 ? Math.round((passedExams / totalStudents) * 100) : 0

  return (
    <div className="relative z-10 homepage h-full">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-34">
        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tinglovchilar"
            value={totalStudents}
            icon={
              <svg
                className="w-8 h-8 text-blue-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            loading={studentCountQuery.isLoading}
          />

          <StatCard
            title="O'quv kurslar"
            value={totalCourses}
            icon={
              <svg
                className="w-8 h-8 text-green-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
            loading={studentCountQuery.isLoading}
          />

          <StatCard
            title="Faol o'quv kurslar"
            value={activeCourses}
            icon={
              <svg
                className="w-8 h-8 text-purple-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            }
            loading={studentCountQuery.isLoading}
          />

          <StatCard
            title="Imtihon natijasi"
            value={`${passRate}%`}
            icon={
              <svg
                className="w-8 h-8 text-yellow-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            loading={studentCountQuery.isLoading}
          />
        </div>

        <Stats />
      </div>
    </div>
  )
}

// Компонент карточки статистики
const StatCard = ({
  title,
  value,
  icon,
  loading,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  loading: boolean
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-white/10">
      <div className="flex items-center">
        <div className="p-3 rounded-lg mr-4 bg-white/20">{icon}</div>
        <div>
          <p className="text-sm text-white/80 drop-shadow-sm">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-white/20 rounded mt-1 animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-white drop-shadow-sm">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
