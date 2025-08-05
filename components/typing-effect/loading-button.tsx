import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function LoadingButton({
  isLoading,
  loadingText = 'Conectando con IA...',
  children,
  disabled,
  onClick,
  type = 'button',
  className = 'w-full',
  size = 'lg',
  variant = 'default'
}: LoadingButtonProps) {
  return (
    <Button
      type={type}
      disabled={disabled || isLoading}
      className={className}
      size={size}
      variant={variant}
      onClick={onClick}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
} 