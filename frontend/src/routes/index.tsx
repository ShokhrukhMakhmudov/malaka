import Header from '@/components/Header'
import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@/utils/trpc'

export const Route = createFileRoute('/')({
  component: Home,
})

// Тип данных для курса
type CourseStats = {
  courseId: string
  courseName: string
  prefix: string
  totalStudents: number
  passedStudents: number
}

export default function Home() {
  // Загрузка данных статистики
  const studentCountQuery = trpc.dashboard.getStudentCount.useQuery()
  const courseStatsQuery = trpc.dashboard.getCourseStats.useQuery()

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
            title="Kurslar"
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
            title="Faol kurslar"
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

        {/* Заголовок статистики курсов */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white drop-shadow-md">
            Statistika
          </h2>
          <div className="text-white drop-shadow-sm">
            Faol kurslar soni:{' '}
            <span className="font-medium">{activeCourses}</span>
          </div>
        </div>

        {/* Карточки курсов */}
        {courseStatsQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg overflow-hidden p-6"
              >
                <div className="animate-pulse">
                  <div className="h-6 bg-white/20 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-white/20 rounded w-1/4 mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-white/20 rounded w-full"></div>
                    <div className="h-2 bg-white/20 rounded w-full"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courseStatsQuery.data && courseStatsQuery.data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseStatsQuery.data.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-medium text-white mt-4 drop-shadow-sm">
              Kurslar mavjud emas
            </h3>
            <p className="text-white/70 mt-2 drop-shadow-sm">
              Kurslar yaratilgandan so'ng ma'lumotlar paydo bo'ladi
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
// Компонент карточки курса
const CourseCard = ({ course }: { course: Omit<CourseStats, 'prefix'> }) => {
  const passRate =
    course.totalStudents > 0
      ? Math.round((course.passedStudents / course.totalStudents) * 100)
      : 0

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-white/10">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white drop-shadow-sm">
              {course.courseName}
            </h3>
          </div>
          <span className="bg-blue-400/20 text-white font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
            {course.totalStudents} ta
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-white/80 drop-shadow-sm">
              Imtihon natijasi
            </span>
            <span className="font-medium text-white drop-shadow-sm">
              {passRate}%
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-green-400 h-2 rounded-full"
              style={{ width: `${passRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-white/60">0%</span>
            <span className="text-xs text-white/60">100%</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4 ">
        <div className="text-sm flex items-center justify-between border-green-400 border-1 rounded-md py-1 px-2">
          <span className="text-white/70">Muvaffaqiyatli:</span>
          <span className="font-medium text-white text-lg">
            {course.passedStudents}
          </span>
        </div>
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
