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

export default function CertificateSearchPage() {
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

      {authStore.state.isAuth && (
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
