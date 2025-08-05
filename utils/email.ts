export const getEmailFromStorage = (): string => {
  console.log('Intentando obtener email del localStorage...')
  const email = localStorage.getItem('email')
  console.log('Email encontrado en localStorage:', email)
  
  if (!email) {
    console.error('No se encontró email en localStorage')
    throw new Error('No se encontró el email del usuario. Por favor, inicie sesión nuevamente.')
  }
  return email
}

export const validateEmail = (email: string): boolean => {
  console.log('Validando email:', email)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email)
  console.log('Email válido:', isValid)
  return isValid
} 