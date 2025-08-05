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

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Link href={tool.href} onClick={handleClick} prefetch={true}>
            <div className="relative group">
              <motion.div 
                className="relative overflow-hidden rounded-2xl p-6 h-full cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 244, 0.9))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(101, 204, 138, 0.2)',
                  boxShadow: '0 8px 32px rgba(101, 204, 138, 0.1)'
                }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: {
                    duration: 0.3,
                    ease: "easeOut"
                  }
                }}
                whileTap={{
                  scale: 0.98,
                  transition: { duration: 0.2 }
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Animated background gradient */}
                <motion.div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                    borderRadius: '16px'
                  }}
                />

                {/* Floating particles effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, #65cc8a, transparent)',
                        left: `${20 + i * 30}%`,
                        top: `${30 + i * 20}%`
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>

                {/* Header with icon and favorite button */}
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <motion.div 
                    className="relative"
                    whileHover={{ 
                      rotate: [0, -5, 5, 0],
                      scale: 1.1,
                      transition: { 
                        duration: 0.5,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
                         style={{
                           background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.2), rgba(74, 222, 128, 0.2))',
                           boxShadow: '0 8px 16px rgba(101, 204, 138, 0.3)',
                           border: '1px solid rgba(101, 204, 138, 0.3)'
                         }}>
                      {/* Icon glow effect */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: 'radial-gradient(circle, rgba(101, 204, 138, 0.3), transparent)'
                        }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      {tool.icon}
                    </div>
                  </motion.div>

                  <div className="flex items-center gap-2">
                    {tool.isCustom && onDeactivate && (
                      <motion.button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDeactivate(tool.id)
                        }}
                        className="px-3 py-1 rounded-lg flex items-center gap-2 transition-all duration-300"
                        style={{
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#dc2626'
                        }}
                        whileHover={{ 
                          scale: 1.05,
                          transition: { 
                            duration: 0.2,
                            ease: "easeInOut"
                          }
                        }}
                        whileTap={{ 
                          scale: 0.95,
                          transition: { 
                            type: "spring",
                            stiffness: 400,
                            damping: 10
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Eliminar</span>
                      </motion.button>
                    )}
                    <motion.button 
                      onClick={(e) => onFavoriteClick(e, tool.href)}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none
                        hover:scale-110 relative"
                      whileHover={{ 
                        scale: 1.2,
                        rotate: [0, -10, 10, -10, 0],
                        transition: { 
                          duration: 0.5,
                          ease: "easeInOut"
                        }
                      }}
                      whileTap={{ 
                        scale: 0.9,
                        transition: { 
                          type: "spring",
                          stiffness: 400,
                          damping: 10
                        }
                      }}
                    >
                      {/* Star glow effect */}
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.3), transparent)'
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        whileHover={{ 
                          scale: 1.5,
                          opacity: [0, 0.5, 0],
                          transition: { duration: 0.5 }
                        }}
                      />
                      {favorites.includes(tool.href) ? (
                        <Star 
                          className="w-6 h-6 text-yellow-500 fill-yellow-500 cursor-pointer"
                          style={{ filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.5))' }}
                        />
                      ) : (
                        <Star 
                          className="w-6 h-6 text-gray-400 cursor-pointer hover:text-yellow-500 transition-colors duration-300"
                        />
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <motion.h3 
                    className="text-xl font-bold mb-3 font-montserrat"
                    style={{ 
                      color: '#000000'
                    }}
                    whileHover={{ 
                      x: [0, 5, -5, 5, 0],
                      transition: { 
                        duration: 0.5,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    {tool.title}
                  </motion.h3>
                  <motion.p 
                    className="text-sm leading-relaxed font-montserrat"
                    style={{ color: '#000000' }}
                    whileHover={{ 
                      x: [0, 5, -5, 5, 0],
                      transition: { 
                        duration: 0.5,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    {tool.description}
                  </motion.p>
                </div>

                {/* Animated progress bar */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl"
                  style={{
                    background: 'linear-gradient(90deg, #65cc8a, #4ade80, #22c55e)'
                  }}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)'
                    }}
                    animate={{
                      x: ["-100%", "100%"],
                      transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }
                    }}
                  />
                </motion.div>

                {/* Premium badge */}
                {tool.isPremium && (
                  <motion.span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold absolute top-4 right-4"
                    style={{
                      background: 'linear-gradient(135deg, #65cc8a, #4ade80)',
                      color: 'white',
                      boxShadow: '0 4px 8px rgba(101, 204, 138, 0.3)'
                    }}
                    whileHover={{ scale: 1.1 }}
                  >
                    Premium
                  </motion.span>
                )}

                {/* Hover overlay effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.05), rgba(74, 222, 128, 0.05))',
                    border: '1px solid rgba(101, 204, 138, 0.2)'
                  }}
                />
              </motion.div>
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-4 bg-white border border-gray-200 shadow-xl rounded-xl font-montserrat z-[9999]"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 244, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(101, 204, 138, 0.2)',
            boxShadow: '0 20px 40px rgba(101, 204, 138, 0.2)'
          }}
          sideOffset={10}
          align="start"
        >
          <p className="text-sm font-medium" style={{ color: '#000000' }}>{tool.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 