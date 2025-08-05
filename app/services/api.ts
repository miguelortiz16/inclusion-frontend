const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://planbackend.us-east-1.elasticbeanstalk.com/api/education';

export interface ApiResponse {
  success: boolean;
  data: string;
  error?: string;
}

export const educationApi = {
  createQuiz: async (topic: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/crear-cuestionario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topic),
      });
      const data = await response.text();
      return { success: true, data };
    } catch (error) {
      return { success: false, data: '', error: 'Error creating quiz' };
    }
  },

  createLessonPlan: async (topic: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/crear-plan-de-leccion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topic),
      });
      const data = await response.text();
      return { success: true, data };
    } catch (error) {
      return { success: false, data: '', error: 'Error creating lesson plan' };
    }
  },

  createEducationalMaterial: async (topic: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/crear-material-educativo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topic),
      });
      const data = await response.text();
      return { success: true, data };
    } catch (error) {
      return { success: false, data: '', error: 'Error creating educational material' };
    }
  },

  createContext: async (topic: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/crear-contexto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topic),
      });
      const data = await response.text();
      return { success: true, data };
    } catch (error) {
      return { success: false, data: '', error: 'Error creating context' };
    }
  },

  generateIdeas: async (topic: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generar-ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topic),
      });
      const data = await response.text();
      return { success: true, data };
    } catch (error) {
      return { success: false, data: '', error: 'Error generating ideas' };
    }
  },

  generateWritingPrompt: async (topic: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generar-consigna-de-escritura`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(topic),
      });
      const data = await response.text();
      return { success: true, data };
    } catch (error) {
      return { success: false, data: '', error: 'Error generating writing prompt' };
    }
  },
}; 