"use client"

import React, { createContext, useContext, useState } from 'react'

interface PinnedContext {
  pinnedInstanceId: string | null
  setPinnedInstanceId: (id: string | null) => void
}

const PinnedCardContext = createContext<PinnedContext | undefined>(undefined)

export function PinnedCardProvider({ children }: { children: React.ReactNode }) {
  const [pinnedInstanceId, setPinnedInstanceId] = useState<string | null>(null)
  return (
    <PinnedCardContext.Provider value={{ pinnedInstanceId, setPinnedInstanceId }}>
      {children}
    </PinnedCardContext.Provider>
  )
}

export function usePinnedCard() {
  const ctx = useContext(PinnedCardContext)
  if (!ctx) throw new Error('usePinnedCard must be used within PinnedCardProvider')
  return ctx
}

export default PinnedCardContext
