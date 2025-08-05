'use client';

import axios from 'axios';

const API_URL = 'https://planbackend.us-east-1.elasticbeanstalk.com/api/gamification';
const BACKEND_URL = 'https://planbackend.us-east-1.elasticbeanstalk.com/api';

export interface GamificationData {
  points: number;
  badges: string[];
  rank: number;
}

export const gamificationService = {
  // Obtener datos de gamificación del usuario
  getUserGamification: async (email: string): Promise<GamificationData> => {
    const response = await axios.get(`${API_URL}/profesor/gamificacion`, {
      params: { email }
    });
    return response.data;
  },

  // Obtener ranking de usuarios
  getRanking: async (): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/ranking`);
    return response.data;
  },

  // Agregar puntos por completar una tarea
  async addPoints(email: string, points: number, action: string): Promise<void> {
    try {
      const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/gamification/profesor/completar-tarea?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Error al agregar puntos');
      }
    } catch (error) {
      console.error('Error al agregar puntos:', error);
     return
    }
  },

  // Crear cuestionario y agregar puntos
  createQuestionnaire: async (email: string, questionnaireData: any): Promise<any> => {
    const response = await axios.post(`${API_URL}/profesor/cuestionarios`, questionnaireData, {
      params: { email }
    });
    
    if (response.data.success) {
      // Agregar puntos si el cuestionario se creó exitosamente
      await gamificationService.addPoints(email, 10, 'questionnaire_creation');
    }
    
    return response.data;
  }
}; 