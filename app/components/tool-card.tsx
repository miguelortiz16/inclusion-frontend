import { ReactNode } from 'react'

interface ToolCardProps {
  icon: ReactNode
  title: string
  description: string
}

export function ToolCard({ icon, title, description }: ToolCardProps) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>
    </div>
  )
} 