"use client"

import { useContext } from 'react'
import { useLanguage } from '@/app/contexts/LanguageContext'
import { translations, Translations, Language } from './translations'

type TranslationKey = keyof Translations | `${keyof Translations}.${string}`

export function useTranslations() {
  const { language } = useLanguage()
  
  return (key: TranslationKey, params?: Record<string, string | number>) => {
    const keys = key.split('.') as (keyof Translations)[]
    let value: any = translations[language as Language]
    
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
} 