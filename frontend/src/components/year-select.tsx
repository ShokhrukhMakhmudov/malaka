// components/YearSelect.tsx
import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/utils/trpc'
import { yearStore, setSelectedYear } from '@/stores/year.store'
import { Skeleton } from '@/components/ui/skeleton'

export function YearSelect() {
  const [isClient, setIsClient] = useState(false)
  const [data, setData] = useState<number>(yearStore.state)
  // Получаем доступные годы с бэкенда
  const { data: availableYears = [], isLoading } =
    trpc.dashboard.getAvailableYears.useQuery()

  useEffect(() => {
    setData(yearStore.state)
  }, [yearStore.state])
  // Решаем проблему hydration (SSR)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year))
  }

  // Если еще не загрузились на клиенте, показываем скелетон
  if (!isClient || isLoading) {
    return (
      <div className="w-[130px]">
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <Select value={data.toString()} onValueChange={handleYearChange}>
      <SelectTrigger className="w-[100px] text-lg" iconStyle="text-black">
        <SelectValue placeholder="Yilni tanlang" />
      </SelectTrigger>
      <SelectContent className="z-100">
        {availableYears.map((year) => (
          <SelectItem className="text-lg" key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
        <SelectItem className="text-lg" key={'2026'} value={'2026'.toString()}>
          {'2026'}
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
