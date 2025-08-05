'use client'

import { RankingList } from '@/app/components/RankingList'
import { Trophy, Star, Award } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function RankingPage() {
  const { t } = useLanguage()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm">
          <Trophy className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            {t('ranking.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('ranking.subtitle')}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-gray-800">
              {t('ranking.promotion.title')}
            </h2>
          </div>
          <div className="space-y-3">
            <p className="text-gray-600 leading-relaxed">
              {t('ranking.promotion.description')}
            </p>
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <Award className="w-4 h-4" />
              <p>{t('ranking.promotion.callToAction')}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-6">
          <RankingList />
        </div>
      </div>
    </div>
  )
} 