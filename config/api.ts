import { getEmailFromStorage, validateEmail } from "@/utils/email"

export const API_ENDPOINTS = {
  baseUrl: 'https://planbackend.us-east-1.elasticbeanstalk.com/api/education',
  endpoints: {
    createQuiz: '/crear-cuestionario',
    createLessonPlan: '/crear-plan-de-leccion',
    createUnitPlan: '/crear-plan-de-unidades',
    createEducationalMaterial: '/crear-material-educativo',
    createContext: '/crear-contexto',
    generateIdeas: '/generar-ideas',
    freeAI: '/ia-libre',
    generateRealWorldBenefits: '/beneficios-del-mundo-real',
    generateProject: '/generar-proyecto',
    generateWritingPrompt: '/generar-consigna-de-escritura',
    generateStudentReport: '/generar-informe-estudiantil',
    generateParentsEmail: '/generar-correo-para-padres',
    getRequests: '/consultar-peticiones',
    generateVideoQuestions: '/generateVideoQuestions'
  }
}

export interface TopicRequest {
  topic: string
  email: string
}

export const createRequestData = (topic: string, email: string): TopicRequest => {
  console.log('Creando request data con:', { topic, email })
  
  if (!validateEmail(email)) {
    console.error('Email inválido:', email)
    throw new Error('El email proporcionado no es válido')
  }

  const requestData = {
    topic,
    email
  }
  
  console.log('Request data creado:', requestData)
  return requestData
}

export const getEndpointUrl = (endpoint: keyof typeof API_ENDPOINTS.endpoints): string => {
  const url = `${API_ENDPOINTS.baseUrl}${API_ENDPOINTS.endpoints[endpoint]}`
  console.log('URL del endpoint:', url)
  return url
}

export async function makeRequest(endpointName: keyof typeof API_ENDPOINTS.endpoints, topic: string): Promise<any> {
  try {
    const email = getEmailFromStorage()
    console.log('Email del usuario:', email)

    const url = getEndpointUrl(endpointName)
    console.log('URL a llamar:', url)

    const requestData = createRequestData(topic, email)
    console.log('Datos de la petición:', JSON.stringify(requestData, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })

    console.log('Status de la respuesta:', response.status)

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`)
    }

    // Intentar obtener la respuesta como texto primero
    const textResponse = await response.text()
    console.log('Respuesta del servidor (texto):', textResponse)

    try {
      // Intentar parsear como JSON
      return JSON.parse(textResponse)
    } catch (e) {
      // Si no es JSON, devolver el texto plano
      return textResponse
    }
  } catch (error) {
    console.error('Error en makeRequest:', error)
    throw error
  }
} 