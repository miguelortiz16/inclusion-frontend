"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Language, translations } from "../utils/translations"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('es')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Solo intentar obtener el idioma del localStorage después de que el componente se monte
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    // Guardar el idioma en localStorage cuando cambie
    if (mounted) {
      localStorage.setItem('language', language)
    }
  }, [language, mounted])

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      if (value === undefined) return key
      value = value[k]
    }
    
    if (typeof value === 'string' && params) {
      return Object.entries(params).reduce((str, [key, val]) => 
        str.replace(new RegExp(`{${key}}`, 'g'), String(val)), value)
    }
    
    return value || key
  }

  const value = {
    language,
    setLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
} 