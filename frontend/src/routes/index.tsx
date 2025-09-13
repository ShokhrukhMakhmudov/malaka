import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: CertificateSearchPage,
})

// src/pages/CertificateSearchPage.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, FileText, Download, Calendar, User, Hash } from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { format } from 'date-fns'
import Header from '@/components/Header'
import { authStore } from '@/stores/auth.store'
import Stats from '@/components/stats'
export default function CertificateSearchPage() {
  const studentCountQuery = trpc.dashboard.getStudentCount.useQuery()

  // Расчет общей статистики
  const totalStudents = studentCountQuery.data?.totalStudents || 0
  const totalCourses = studentCountQuery.data?.totalCourses || 0
  const activeCourses = studentCountQuery.data?.activeCourses || 0
  const passedExams = studentCountQuery.data?.passedExams || 0

  // Расчет процента успешной сдачи экзаменов
  const passRate =
    totalStudents > 0 ? Math.round((passedExams / totalStudents) * 100) : 0

  const [searchType, setSearchType] = useState<'passport' | 'fullName'>(
    'fullName',
  )
  const [searchValue, setSearchValue] = useState('')
  const [searchPerformed, setSearchPerformed] = useState(false)

  const { data, isLoading, error, refetch } =
    trpc.student.getCertificatesByPassportOrName.useQuery(
      {
        [searchType]: searchValue,
      },
      {
        enabled: false,
        retry: false,
      },
    )

  const handleSearch = async () => {
    if (!searchValue.trim()) return

    try {
      await refetch()
      setSearchPerformed(true)
    } catch (err) {
      console.error('Search error:', err)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className=" homepage min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />

      {(!authStore.state.isAuth || authStore.state.user.isSuperAdmin) && (
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
      )}

      {authStore.state.isAuth && !authStore.state.user.isSuperAdmin && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl mt-16 font-bold dark:text-gray-800 text-white mb-2">
              Sertifikatni izlash
            </h1>
            {/* <p className="text-gray-600 dark:text-gray-400">
            Tinglovchining JSHIR raqami yoki to'liq ismi bilan sertifikatlarini
            toping
          </p> */}
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={
                        searchType === 'passport' ? 'default' : 'outline'
                      }
                      onClick={() => setSearchType('passport')}
                      className="flex items-center gap-2"
                    >
                      <Hash className="h-4 w-4" />
                      JSHIR
                    </Button>
                    <Button
                      variant={
                        searchType === 'fullName' ? 'default' : 'outline'
                      }
                      onClick={() => setSearchType('fullName')}
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Ism
                    </Button>
                  </div>

                  <div className="flex-1">
                    <Label htmlFor="searchValue" className="sr-only">
                      {searchType === 'passport'
                        ? 'JSHIR raqami'
                        : "To'liq ism"}
                    </Label>
                    <Input
                      id="searchValue"
                      placeholder={
                        searchType === 'passport'
                          ? 'JSHIR raqamini kiriting'
                          : "To'liq ism kiriting"
                      }
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>

                  <Button
                    onClick={handleSearch}
                    disabled={isLoading || !searchValue.trim()}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {isLoading ? 'Izlanmoqda...' : 'Izlash'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="text-red-700 dark:text-red-300 text-center">
                  {'Sertifikat topilmadi!'}
                </div>
              </CardContent>
            </Card>
          )}

          {searchPerformed && data && (
            <div className="space-y-6">
              {/* Информация о студенте */}
              <Card>
                <CardHeader>
                  <CardTitle>Ma'lumot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">
                        To'liq ismi
                      </Label>
                      <p className="font-medium">{data.student.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">
                        JSHIR raqami
                      </Label>
                      <p className="font-medium">{data.student.passport}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Список сертификатов */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Sertifikatlar ({data.certificates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.certificates.length > 0 ? (
                    <div className="space-y-4">
                      {data.certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-medium">{cert.courseName}</h4>
                              <p className="text-sm text-gray-500">
                                Sertifikat №: {cert.certificateNumber}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(cert.createdAt), 'dd.MM.yyyy')}
                              </div>
                            </div>
                          </div>

                          {cert.certificateUrl && (
                            <Button size="sm" asChild>
                              <a
                                href={cert.certificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Yuklab olish
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p>Sertifikat topilmadi</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
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
