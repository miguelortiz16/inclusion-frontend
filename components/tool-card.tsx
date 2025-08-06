"use client"

import { Tool } from "@/types/tool"
import { motion } from "framer-motion"
import Link from "next/link"
import { RiStarFill, RiMagicFill } from "react-icons/ri"
import { Star, Accessibility, Heart, Shield } from "lucide-react"
import { Trash2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RiHeartFill, RiHeartLine } from "react-icons/ri"

interface ToolCardProps {
  tool: Tool
  onFavoriteClick: (e: React.MouseEvent, href: string) => void
  showExample?: boolean
  onDeactivate?: (id: string) => void
  favorites?: string[]
}

export function ToolCard({ 
  tool, 
  onFavoriteClick, 
  showExample = false,
  onDeactivate,
  favorites = []
}: ToolCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (tool.isPremium) {
      e.preventDefault()
      toast.info("Esta herramienta estará disponible próximamente en la versión premium")
      return
    }
    router.push(tool.href)
  }

  // Determinar el tamaño de la card basado en el ID o importancia
  const getCardSize = () => {
    const importantTools = ['dua', 'ajustes-razonables', 'planificador-lecciones', 'creador-cuestionarios']
    if (importantTools.includes(tool.id)) {
      return 'large' // 2x2
    } else if (tool.id.includes('generador') || tool.id.includes('creador')) {
      return 'medium' // 1x2
    } else {
      return 'small' // 1x1
    }
  }

  const cardSize = getCardSize()

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Link href={tool.href} onClick={handleClick} prefetch={true}>
            <div className="relative group">
              <motion.div 
                className={`relative overflow-hidden cursor-pointer ${
                  cardSize === 'large' ? 'col-span-2 row-span-2' : 
                  cardSize === 'medium' ? 'col-span-1 row-span-2' : 
                  'col-span-1 row-span-1'
                }`}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
                whileHover={{
                  y: -2,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transition: {
                    duration: 0.2,
                    ease: "easeOut"
                  }
                }}
                whileTap={{
                  scale: 0.98,
                  transition: { duration: 0.1 }
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Content */}
                <div className={`relative z-10 h-full flex flex-col ${
                  cardSize === 'large' ? 'p-6' : 
                  cardSize === 'medium' ? 'p-5' : 
                  'p-4'
                }`}>
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg"
                         style={{
                           background: 'rgba(99, 102, 241, 0.08)',
                           border: '1px solid rgba(99, 102, 241, 0.15)'
                         }}>
                      {tool.icon}
                    </div>

                    <div className="flex items-center gap-2">
                      {tool.isCustom && onDeactivate && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onDeactivate(tool.id)
                          }}
                          className="px-2 py-1 rounded text-xs transition-colors"
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#dc2626'
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => onFavoriteClick(e, tool.href)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        {favorites.includes(tool.href) ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <Star className="w-4 h-4 text-gray-400 hover:text-yellow-500 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1">
                    <h3 
                      className={`font-semibold ${
                        cardSize === 'large' ? 'text-xl mb-2' :
                        cardSize === 'medium' ? 'text-lg mb-2' :
                        'text-base mb-1'
                      }`}
                      style={{ color: '#1f2937' }}
                    >
                      {tool.title}
                    </h3>
                    <p 
                      className={`leading-relaxed ${
                        cardSize === 'large' ? 'text-sm' :
                        cardSize === 'medium' ? 'text-sm' :
                        'text-xs'
                      }`}
                      style={{ color: '#6b7280' }}
                    >
                      {cardSize === 'large' 
                        ? tool.description 
                        : cardSize === 'medium' 
                        ? tool.description.substring(0, 80) + '...'
                        : tool.description.substring(0, 50) + '...'
                      }
                    </p>
                  </div>

                  {/* Premium badge */}
                  {tool.isPremium && (
                    <span 
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium absolute top-3 right-3"
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1'
                      }}
                    >
                      Premium
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3 bg-white border border-gray-200 shadow-sm rounded-lg font-montserrat z-[9999]"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
          sideOffset={8}
          align="start"
        >
          <p className="text-sm" style={{ color: '#1f2937' }}>{tool.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 