export interface Tool {
  id: string
  title: string
  description: string
  category: "planning" | "assessment" | "content" | "communication"
  icon: React.ReactNode
  href: string
  isCustom?: boolean
  isPremium?: boolean
} 