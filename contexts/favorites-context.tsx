"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface FavoritesContextType {
  favorites: string[]
  toggleFavorite: (workshopId: string) => void
  isFavorite: (workshopId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    // Cargar favoritos del localStorage al montar el componente
    const storedFavorites = JSON.parse(localStorage.getItem("favoriteWorkshops") || "[]")
    setFavorites(storedFavorites)
  }, [])

  const toggleFavorite = (workshopId: string) => {
    const newFavorites = favorites.includes(workshopId)
      ? favorites.filter(id => id !== workshopId)
      : [...favorites, workshopId]

    setFavorites(newFavorites)
    localStorage.setItem("favoriteWorkshops", JSON.stringify(newFavorites))
  }

  const isFavorite = (workshopId: string) => {
    return favorites.includes(workshopId)
  }

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
} 