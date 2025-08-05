"use client"

import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useSidebar } from "@/contexts/sidebar-context"

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  const { isOpen, isMobile } = useSidebar()

  return (
    <div className="flex min-h-screen bg-white">
      {showSidebar && <Sidebar />}
      <main 
        className={`
          flex-1
          transition-all
          duration-300
          ${showSidebar && isOpen && !isMobile ? 'ml-32' : 'ml-0'}
          ${isMobile ? 'pb-20' : ''}
        `}
      >
        {children}
      </main>
      <MobileNav />
    </div>
  )
}

