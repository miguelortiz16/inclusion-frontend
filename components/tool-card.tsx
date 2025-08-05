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
                className={`bg-white rounded-xl border p-4 sm:p-6 
                  shadow-lg hover:shadow-xl
                  transition-all duration-300 ease-out
                  flex flex-col
                  relative
                  overflow-hidden
                  before:absolute before:inset-0 before:z-0 before:bg-gradient-to-b before:from-white before:to-green-50 before:opacity-0 before:transition-opacity before:duration-300
                  hover:before:opacity-100
                  h-full
                  border-t-4 ${tool.isCustom ? "border-purple-500" : "border-green-500"}
                  group-hover:border-green-600
                  after:absolute after:inset-0 after:z-0 after:bg-gradient-to-r after:from-green-500/10 after:to-transparent after:opacity-0 after:transition-opacity after:duration-500
                  group-hover:after:opacity-100
                  perspective-1000
                  transform-style-preserve-3d
                  ${tool.isPremium ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(101, 204, 138, 0.1)',
                  boxShadow: '0 4px 6px rgba(101, 204, 138, 0.1)'
                }}
                whileHover={{
                  boxShadow: "0 20px 25px -5px rgba(101, 204, 138, 0.2), 0 8px 10px -6px rgba(101, 204, 138, 0.1)",
                  y: -5,
                  scale: 1.02,
                  rotateX: [0, 5, -5, 0],
                  rotateY: [0, 5, -5, 0],
                  transition: {
                    duration: 0.5,
                    ease: "easeInOut"
                  }
                }}
                whileTap={{
                  scale: 0.98,
                  transition: { duration: 0.2 }
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Efecto especial para herramientas personalizadas */}
                {tool.isCustom && (
                  <>
                    {/* Efecto de rayos mejorado */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Rayos principales */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-40 bg-gradient-to-b from-green-400/60 to-transparent"
                          style={{
                            left: "50%",
                            top: "50%",
                            transformOrigin: "0 0",
                            rotate: `${i * 45}deg`
                          }}
                          initial={{ 
                            scale: 0,
                            opacity: 0
                          }}
                          animate={{ 
                            scale: [0, 1, 0],
                            opacity: [0, 0.9, 0],
                            y: [0, -40, 0]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut"
                          }}
                        />
                      ))}

                      {/* Rayos secundarios */}
                      {[...Array(16)].map((_, i) => (
                        <motion.div
                          key={`secondary-${i}`}
                          className="absolute w-1 h-32 bg-gradient-to-b from-green-300/40 to-transparent"
                          style={{
                            left: "50%",
                            top: "50%",
                            transformOrigin: "0 0",
                            rotate: `${i * 22.5}deg`
                          }}
                          initial={{ 
                            scale: 0,
                            opacity: 0
                          }}
                          animate={{ 
                            scale: [0, 1, 0],
                            opacity: [0, 0.6, 0],
                            y: [0, -30, 0]
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.05,
                            ease: "easeInOut"
                          }}
                        />
                      ))}

                      {/* Centro energético */}
                      <motion.div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30"
                        initial={{ scale: 0 }}
                        animate={{ 
                          scale: [0, 1.2, 1],
                          opacity: [0, 1, 0.9]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <motion.div
                          className="absolute inset-0 rounded-full bg-white/30"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.7, 0, 0.7]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>

                      {/* Efecto de destello */}
                      <motion.div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-green-400/30"
                        animate={{
                          scale: [1, 2, 1],
                          opacity: [0.5, 0, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                  </>
                )}

                {/* Efecto de brillo */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100"
                  initial={{ x: "-100%" }}
                  whileHover={{ 
                    x: "100%",
                    transition: { 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }
                  }}
                />

                <div className="flex items-start justify-between mb-4 relative z-10">
                  <motion.div 
                    className={`w-14 h-14 flex items-center justify-center rounded-xl group-hover:bg-white transition-colors duration-300 shadow-md
                      group-hover:shadow-lg ${tool.isCustom ? "group-hover:shadow-green-500/20 bg-green-50" : "group-hover:shadow-green-500/20 bg-green-50"}
                      relative overflow-hidden`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(101, 204, 138, 0.1), rgba(74, 222, 128, 0.1))',
                      boxShadow: '0 4px 8px rgba(101, 204, 138, 0.2)'
                    }}
                    whileHover={{ 
                      rotate: [0, -10, 10, -10, 0],
                      scale: 1.1,
                      transition: { 
                        duration: 0.5,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    {/* Efecto de pulso en el icono */}
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-green-400/20"
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
                  </motion.div>

                  <div className="flex items-center gap-2">
                    {tool.isCustom && onDeactivate && (
                      <motion.button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDeactivate(tool.id)
                        }}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded-lg flex items-center gap-2 transition-all duration-300"
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
                        hover:scale-110 hover:rotate-12
                        relative"
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
                      {/* Efecto de destello al hacer hover */}
                      <motion.div
                        className="absolute inset-0 bg-yellow-400/20 rounded-full"
                        initial={{ scale: 0, opacity: 0 }}
                        whileHover={{ 
                          scale: 1.5,
                          opacity: [0, 0.5, 0],
                          transition: { duration: 0.5 }
                        }}
                      />
                      {favorites.includes(tool.href) ? (
                        <Star 
                          className="w-5 h-5 text-yellow-500 fill-yellow-500 cursor-pointer transform group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <Star 
                          className="w-5 h-5 text-gray-400 cursor-pointer transform group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                    </motion.button>
                  </div>
                </div>

                <div className="relative z-10">
                  <motion.h3 
                    className={`text-lg font-semibold mb-2 font-montserrat
                      group-hover:translate-x-1 transition-transform duration-300
                      ${tool.isCustom ? "text-green-900 group-hover:text-green-600" : "text-gray-900 group-hover:text-green-600"}`}
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
                    className="text-gray-600 text-sm line-clamp-2 font-montserrat
                      group-hover:translate-x-1 transition-transform duration-300"
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

                {/* Barra de progreso con efecto de brillo */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    overflow-hidden"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                      transition: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                      }
                    }}
                  />
                </motion.div>

                {tool.isPremium && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white absolute top-2 right-2">
                    Premium
                  </span>
                )}
              </motion.div>
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3 bg-white border border-gray-200 shadow-lg rounded-lg font-montserrat z-[9999]"
          sideOffset={10}
          align="start"
        >
          <p className="text-sm text-gray-600">{tool.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 