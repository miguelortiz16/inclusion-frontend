'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { PointsNotification } from '../components/PointsNotification'

interface PointsContextType {
  showPointsNotification: (points: number, reason: string) => void
}

const PointsContext = createContext<PointsContextType | undefined>(undefined)

export function PointsProvider({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false)
  const [points, setPoints] = useState(0)
  const [reason, setReason] = useState('')

  const showPointsNotification = (points: number, reason: string) => {
    setPoints(points)
    setReason(reason)
    setShow(true)
  }

  return (
    <PointsContext.Provider value={{ showPointsNotification }}>
      {children}
      <PointsNotification
        points={points}
        reason={reason}
        show={show}
        onClose={() => setShow(false)}
      />
    </PointsContext.Provider>
  )
}

export function usePoints() {
  const context = useContext(PointsContext)
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider')
  }
  return context
} 