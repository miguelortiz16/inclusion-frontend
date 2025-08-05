"use client"

import { SidebarProvider } from "@/contexts/sidebar-context"
import { FavoritesProvider } from "@/contexts/favorites-context"
import { Layout } from "@/components/layout"
import { Toaster } from "react-hot-toast"
import { usePathname } from 'next/navigation'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/onboarding'|| pathname === '/privacy-policy'|| pathname === '/forgot-password'|| pathname === '/terms'|| pathname === '/verify-email') {
    return (
      <>
        {children}
        <Toaster position="top-center" />
      </>
    )
  }

  return (
    <SidebarProvider>
      <FavoritesProvider>
        <Layout>{children}</Layout>
        <Toaster position="top-center" />
      </FavoritesProvider>
    </SidebarProvider>
  )
} 