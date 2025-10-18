"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface HistoryContextType {
  isHistoryOpen: boolean
  setIsHistoryOpen: (open: boolean) => void
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  return (
    <HistoryContext.Provider value={{ isHistoryOpen, setIsHistoryOpen }}>
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory() {
  const context = useContext(HistoryContext)
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider')
  }
  return context
}