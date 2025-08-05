"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFavorites } from "@/contexts/favorites-context"

interface FavoriteButtonProps {
  workshopId: string
  className?: string
}

export function FavoriteButton({ workshopId, className = "" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")

  const handleToggleFavorite = () => {
    const wasFavorite = isFavorite(workshopId)
    toggleFavorite(workshopId)
    
    // Mostrar alerta
    setAlertMessage(wasFavorite ? "Taller eliminado de favoritos" : "Taller agregado a favoritos")
    setShowAlert(true)
    
    // Ocultar alerta después de 3 segundos
    setTimeout(() => {
      setShowAlert(false)
    }, 3000)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={handleToggleFavorite}
      >
        <Star
          className={`w-5 h-5 ${
            isFavorite(workshopId) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
          }`}
        />
      </Button>
      
      {showAlert && (
        <Alert className="absolute top-12 right-0 w-64 bg-white shadow-lg border border-gray-200">
          <AlertDescription className="text-sm">
            {alertMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 