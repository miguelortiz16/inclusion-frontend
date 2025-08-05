import { makeRequest } from "@/config/api"

export const testAllRequests = async () => {
  const testTopic = "Tema de prueba"
  const endpoints = [
    'createQuiz',
    'createLessonPlan',
    'createUnitPlan',
    'createEducationalMaterial',
    'createContext',
    'generateIdeas',
    'freeAI',
    'generateRealWorldBenefits',
    'generateProject',
    'generateWritingPrompt',
    'generateStudentReport',
    'generateParentsEmail'
  ] as const

  console.log('Iniciando pruebas de peticiones...')
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nProbando endpoint: ${endpoint}`)
      const response = await makeRequest(endpoint, testTopic)
      console.log(`✅ Petición exitosa para ${endpoint}:`, response)
    } catch (error) {
      console.error(`❌ Error en petición ${endpoint}:`, error)
    }
  }
} 