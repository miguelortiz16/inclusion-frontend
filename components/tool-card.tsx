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

  // Determinar el tamaño del círculo basado en el ID o importancia
  const getCircleSize = () => {
    const importantTools = ['dua', 'ajustes-razonables', 'planificador-lecciones', 'creador-cuestionarios']
    if (importantTools.includes(tool.id)) {
      return 'large' // 2x2
    } else if (tool.id.includes('generador') || tool.id.includes('creador')) {
      return 'medium' // 1x2
    } else {
      return 'small' // 1x1
    }
  }

  const circleSize = getCircleSize()

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Link href={tool.href} onClick={handleClick} prefetch={true}>
            <div className="relative group">
              <motion.div 
                className="relative cursor-pointer col-span-1 row-span-1"
                style={{
                  background: 'transparent',
                  borderRadius: '50%',
                  border: 'none',
                  aspectRatio: '1/1',
                  width: circleSize === 'large' ? '180px' : circleSize === 'medium' ? '160px' : '140px',
                  height: circleSize === 'large' ? '180px' : circleSize === 'medium' ? '160px' : '140px',
                  margin: '0 auto'
                }}
                whileHover={{
                  scale: 1.08,
                  y: -4,
                  transition: {
                    duration: 0.2,
                    ease: "easeOut"
                  }
                }}
                whileTap={{
                  scale: 0.95,
                  transition: { duration: 0.1 }
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Círculo principal */}
                <div 
                  className="w-full h-full flex flex-col items-center justify-center relative"
                  style={{
                    background: isHovered 
                      ? 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.06) 70%, transparent 100%)'
                      : 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transition: 'background 0.3s ease',
                    boxShadow: isHovered 
                      ? '0 8px 25px rgba(99, 102, 241, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
                      : '0 4px 15px rgba(99, 102, 241, 0.1), 0 2px 5px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  
                  {/* Icono central */}
                  <div 
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: circleSize === 'large' ? '60px' : circleSize === 'medium' ? '50px' : '45px',
                      height: circleSize === 'large' ? '60px' : circleSize === 'medium' ? '50px' : '45px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderRadius: '50%',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)'
                    }}
                  >
                    <div style={{ 
                      fontSize: circleSize === 'large' ? '24px' : circleSize === 'medium' ? '20px' : '18px',
                      color: '#6366f1'
                    }}>
                      {tool.icon}
                    </div>
                  </div>

                  {/* Título */}
                  <h3 
                    className={`font-medium text-center ${
                      circleSize === 'large' ? 'text-base mb-1' :
                      circleSize === 'medium' ? 'text-sm mb-1' :
                      'text-sm mb-1'
                    }`}
                    style={{ color: '#1f2937' }}
                  >
                    {tool.title}
                  </h3>

                  {/* Botones flotantes */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {tool.isCustom && onDeactivate && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDeactivate(tool.id)
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          boxShadow: '0 1px 3px rgba(239, 68, 68, 0.2)'
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => onFavoriteClick(e, tool.href)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      style={{
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {favorites.includes(tool.href) ? (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Star className="w-3 h-3 text-gray-400 hover:text-yellow-500 transition-colors" />
                      )}
                    </button>
                  </div>

                  {/* Premium badge */}
                  {tool.isPremium && (
                    <span 
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#6366f1',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)'
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