"use client"

export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { VerifyEmailContent } from "./verify-email-content"

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
} 