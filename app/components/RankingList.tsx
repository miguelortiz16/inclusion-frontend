'use client';

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Crown } from 'lucide-react'
import { gamificationService } from '@/app/services/gamification'

interface RankingEntry {
  email: string
  name: string
  points: number
  rank: number
}

export function RankingList() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const data = await gamificationService.getRanking()
        const transformedData = data.map(entry => ({
          ...entry,
          name: entry.name.split(' ')[0]
        }))
        setRanking(transformedData)
      } catch (err) {
        setError('Error al cargar el ranking')
        console.error('Error fetching ranking:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {ranking.map((entry, index) => (
        <motion.div
          key={entry.email}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center gap-4 p-4 rounded-lg ${
            index < 3
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex-shrink-0">
            {index === 0 ? (
              <Crown className="w-6 h-6 text-blue-500" />
            ) : index === 1 ? (
              <Trophy className="w-6 h-6 text-blue-400" />
            ) : index === 2 ? (
              <Medal className="w-6 h-6 text-indigo-500" />
            ) : (
              <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-medium">
                {index + 1}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {entry.name}
            </p>
            <p className="text-xs text-gray-500">
              {entry.points} puntos
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              index < 3
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              #{entry.rank}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
} 