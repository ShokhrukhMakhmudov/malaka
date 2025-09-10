// src/components/CertificateSearchDialog.tsx
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, FileText, Download, Calendar } from 'lucide-react'
import { trpc } from '@/utils/trpc'
import { format } from 'date-fns'

interface CertificateSearchDialogProps {
  trigger?: React.ReactNode
}

export default function CertificateSearchDialog({
  trigger,
}: CertificateSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [passport, setPassport] = useState('')
  const [searchPerformed, setSearchPerformed] = useState(false)

  const { data, isLoading, error, refetch } =
    trpc.student.getCertificatesByPassport.useQuery(
      { passport },
      {
        enabled: false,
        retry: false,
      },
    )

  const handleSearch = async () => {
    if (passport.trim().length !== 14) return

    try {
      await refetch()
      setSearchPerformed(true)
    } catch (err) {
      console.error('Search error:', err)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Сброс состояния при закрытии диалога
      setPassport('')
      setSearchPerformed(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="border rounded-lg bg-transparent flex items-center justify-center tracking-wide cursor-pointer dark:text-black dark:border-black text-white border-white hover:scale-105 active:scale-95">
            <Search className="w-[25px] h-[25px] sm:w-[30px] sm:h-[30px]" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl">Sertifikatni izlash</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!searchPerformed || isLoading || error ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passport">Tinglovchining JSHIR raqami</Label>
                <Input
                  id="passport"
                  placeholder="JSHIR raqamni kiriting"
                  value={passport}
                  onChange={(e) => setPassport(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {(error as any).message || 'Sertifikat topilmadi'}
                </div>
              )}

              <Button
                onClick={handleSearch}
                disabled={isLoading || passport.trim().length !== 14}
                className="w-full"
              >
                {isLoading ? 'Izlanmoqda...' : 'Izlash'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Информация о студенте */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-semibold text-blue-800">
                  {data?.student.fullName}
                </h3>
                <p className="text-blue-600 text-sm">
                  JSHIR: {data?.student.passport}
                </p>
              </div>

              {/* Список сертификатов */}
              {data?.certificates && data.certificates.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  <h4 className="font-medium">Setifikatlar:</h4>

                  {data.certificates.map((cert) => (
                    <div key={cert.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h5 className="font-medium">{cert.courseName}</h5>
                            <p className="text-sm text-gray-500">
                              Sertifikat №: {cert.certificateNumber}
                            </p>

                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(cert.createdAt), 'dd.MM.yyyy')}
                            </div>
                          </div>
                        </div>

                        {cert.certificateUrl && (
                          <Button size="sm" variant="outline" asChild>
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>Sertifikat topilmadi</p>
                </div>
              )}

              <Button
                onClick={() => {
                  setPassport('')
                  setSearchPerformed(false)
                }}
                variant="outline"
                className="w-full"
              >
                Qayta izlash
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
