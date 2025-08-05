import { Button, ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

export function LoadingButton({
  isLoading = false,
  loadingText = "Cargando...",
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </div>
      ) : (
        children
      )}
    </Button>
  )
} 