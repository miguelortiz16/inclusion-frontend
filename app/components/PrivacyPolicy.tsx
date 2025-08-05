import Link from "next/link"
import { Button } from "@/components/ui/button"

export function PrivacyPolicy() {
  return (
    <Link href="/privacy-policy">
      <Button variant="ghost" className="text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium">
        Política de Privacidad
      </Button>
    </Link>
  )
} 