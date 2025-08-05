'use client';

import React, { useEffect, useState } from 'react';
import { gamificationService, GamificationData } from '../services/gamification';
import { useSession } from 'next-auth/react';
import { useLanguage } from "../contexts/LanguageContext"
import { translations } from "@/utils/translations"

const GamificationBadge: React.FC = () => {
  const { data: session } = useSession();
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage()
  const t = translations[language]

  useEffect(() => {
    const fetchGamificationData = async () => {
      if (session?.user?.email) {
        try {
          const data = await gamificationService.getUserGamification(session.user.email);
          setGamificationData(data);
        } catch (error) {
          console.error('Error fetching gamification data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGamificationData();
  }, [session]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!gamificationData) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        <div className="text-2xl">🏆</div>
        <div>
          <div className="font-bold">{gamificationData.points} {t.community.points}</div>
          <div className="text-sm text-gray-600">Rank #{gamificationData.rank}</div>
        </div>
      </div>
      {gamificationData.badges.length > 0 && (
        <div className="mt-2">
          <div className="text-sm font-semibold">{t.community.medals}:</div>
          <div className="flex space-x-2 mt-1">
            {gamificationData.badges.map((badge, index) => (
              <span key={index} className="text-xs bg-yellow-100 px-2 py-1 rounded">
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationBadge; 