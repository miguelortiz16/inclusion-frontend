import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { LanguageProvider } from "./contexts/LanguageContext"
import { ClientLayout } from "./client-layout"
import GamificationBadge from './components/GamificationBadge'
import { Providers } from './providers'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Profe Planner AI- Tu asistente de IA para la planificación educativa  ia educacion",
  description: "Crea contenido educativo de calidad en minutos con la ayuda de la Inteligencia Artificial de ProfePlanner AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <LanguageProvider>
          <SidebarProvider>
            <div className="flex min-h-screen">
              <main className="flex-1">
                <Providers>
                  <ClientLayout>{children}</ClientLayout>
                  <GamificationBadge />
                </Providers>
              </main>
            </div>
          </SidebarProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

import './globals.css'