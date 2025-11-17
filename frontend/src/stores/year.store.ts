import { Store } from '@tanstack/store'

export const yearStore = new Store<number>(
  localStorage.getItem('selectedYear')
    ? parseInt(localStorage.getItem('selectedYear') as string)
    : new Date().getFullYear(),
)

export const setSelectedYear = (year: number) => {
  localStorage.setItem('selectedYear', year.toString())
  yearStore.setState(year)

  window.location.reload()
}

export const getSelectedYear = () => {
  return yearStore.state
}
