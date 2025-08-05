import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
// Importamos todos los iconos de Lucide directamente para evitar problemas de tipado
import * as LucideIcons from 'lucide-react';
import * as RiIcons from 'react-icons/ri';

interface DynamicIconProps {
  iconName: string;
  pack?: 'lucide' | 'ri';
  className?: string;
}

export function DynamicIcon({ iconName, pack = 'lucide', className = "w-6 h-6" }: DynamicIconProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Renderizar iconos basados en el nombre y el paquete
  const renderIcon = () => {
    try {
      if (pack === 'lucide') {
        // @ts-ignore - Sabemos que puede que el ícono no exista
        const LucideIcon = LucideIcons[iconName];
        if (LucideIcon) {
          return <LucideIcon className={className} />;
        }
      } else if (pack === 'ri') {
        // Para React Icons, necesitamos el prefijo Ri
        const riIconName = iconName.startsWith('Ri') ? iconName : `Ri${iconName}`;
        // @ts-ignore - Sabemos que puede que el ícono no exista
        const RiIcon = RiIcons[riIconName];
        if (RiIcon) {
          return <RiIcon className={className} />;
        }
      }
      throw new Error(`Icon ${iconName} not found in ${pack}`);
    } catch (error) {
      setError(true);
      console.error(`Error rendering icon ${iconName}:`, error);
      return <span className={className}></span>;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [iconName, pack]);

  if (loading) {
    return <Loader2 className={`animate-spin ${className}`} />;
  }

  if (error) {
    return <span className={className}></span>;
  }

  return renderIcon();
} 