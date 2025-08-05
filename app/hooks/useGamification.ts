'use client';

import { useState } from 'react';
import { gamificationService } from '../services/gamification';
import { useSession } from 'next-auth/react';

export const useGamification = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const addPoints = async (points: number, taskType: string) => {
    if (!session?.user?.email) return;

    setIsLoading(true);
    try {
      await gamificationService.addPoints(session.user.email, points, taskType);
      // Aquí podrías mostrar una notificación de éxito
    } catch (error) {
      console.error('Error adding points:', error);
      // Aquí podrías mostrar una notificación de error
      return
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addPoints,
    isLoading
  };
}; 