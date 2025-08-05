"use client"

import React, { ReactNode, createContext, useState } from 'react'
import { translations, Translations } from '@/utils/translations'

type LanguageContextType = {
  language: 'en' | 'es'
  setLanguage: (lang: 'en' | 'es') => void
  t: (key: string, params?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'es'>('es') // Default to Spanish

  const t = (key: string, params?: Record<string, string>): string => {
    // Get the translation object based on current language
    const translationObj = translations[language]
    
    // Split the key into parts to traverse the translation object
    const keys = key.split('.')
    let value: any = translationObj
    
    // Traverse the translation object to find the value
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }

    // If the value is not a string, return the key
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`)
      return key
    }

    // Replace parameters in the translation string
    if (params) {
      return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
        return str.replace(`{${paramKey}}`, paramValue)
      }, value)
    }

    return value
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
} 