import dynamic from 'next/dynamic';
import { Button } from '../components/ui/button';
import React from 'react';

// Exportamos todos los componentes con carga dinámica desde un solo lugar
// Esto ayuda a webpack a crear chunks más estables

// TypingEffect con carga perezosa
export const LazyTypingEffect = dynamic(() => import('./typing-effect'), {
  ssr: false,
  loading: () => (
    <div className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-gray-500 min-h-[500px]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-gray-200 mb-4"></div>
        <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
});

// LoadingButton con carga perezosa
export const LazyLoadingButton = dynamic<any>(
  () => import('./typing-effect').then(mod => mod.LoadingButton), 
  {
    ssr: false,
    loading: () => (
      <Button disabled className="w-full" size="lg">
        <div className="animate-pulse">Cargando...</div>
      </Button>
    )
  }
);

// Función para cargar jsPDF dinámicamente
export async function loadJsPDF() {
  try {
    const jsPDFModule = await import('jspdf');
    return jsPDFModule.default;
  } catch (error) {
    console.error('Error al cargar jsPDF:', error);
    throw error;
  }
} 