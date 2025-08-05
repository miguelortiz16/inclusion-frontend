"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState, useEffect } from "react"

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ onSearch, placeholder = "Buscar...", className = "" }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, onSearch])

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 bg-[#F4F7FB] border-none hover:bg-[#DDE8F2] focus:bg-white transition-colors duration-200"
      />
    </div>
  )
} 