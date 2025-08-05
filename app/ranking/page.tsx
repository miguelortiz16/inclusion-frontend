'use client'

import { RankingList } from '@/app/components/RankingList'
import { Trophy, Star, Award, Accessibility, Heart, Shield } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function RankingPage() {
  const { t } = useLanguage()

  return (
    <div className="max-w-4xl mx-auto p-6"
         style={{
           background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #dcfce7 100%)',
           minHeight: '100vh',
           position: 'relative',
           overflow: 'hidden'
         }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-20"
             style={{ 
               background: 'radial-gradient(circle, #65cc8a, transparent)',
               animation: 'float 6s ease-in-out infinite'
             }}></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full opacity-15"
             style={{ 
               background: 'radial-gradient(circle, #4ade80, transparent)',
               animation: 'float 8s ease-in-out infinite reverse'
             }}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 rounded-full opacity-10"
             style={{ 
               background: 'radial-gradient(circle, #65cc8a, transparent)',
               animation: 'float 7s ease-in-out infinite'
             }}></div>
      </div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl shadow-sm"
             style={{
               background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))',
               boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)'
             }}>
          <Trophy className="w-7 h-7" style={{ color: '#65cc8a' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold"
               style={{ color: '#000000' }}>
            {t('ranking.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#000000' }}>{t('ranking.subtitle')}</p>
        </div>
      </div>
      
      <div className="rounded-2xl p-8"
           style={{
             background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
             backdropFilter: 'blur(20px)',
             border: '1px solid rgba(101, 204, 138, 0.2)',
             boxShadow: '0 20px 40px rgba(101, 204, 138, 0.1)'
           }}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-5 h-5" style={{ color: '#fbbf24' }} />
            <h2 className="text-xl font-semibold"
                 style={{ color: '#000000' }}>
              {t('ranking.promotion.title')}
            </h2>
          </div>
          <div className="space-y-3">
            <p className="leading-relaxed"
               style={{ color: '#000000' }}>
              {t('ranking.promotion.description')}
            </p>
            <div className="flex items-center gap-2 font-medium"
                 style={{ color: '#65cc8a' }}>
              <Award className="w-4 h-4" />
              <p>{t('ranking.promotion.callToAction')}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6"
             style={{ borderColor: 'rgba(101, 204, 138, 0.2)' }}>
          <RankingList />
        </div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
} 