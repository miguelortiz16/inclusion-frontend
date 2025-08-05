import React, { Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Skeletons para diferentes partes de la página
const ToolbarSkeleton = () => (
  <div className="border-b pb-3 mb-6 flex items-center gap-2 animate-pulse">
    <div className="w-24 h-8 bg-gray-200 rounded-lg"></div>
    <div className="w-10 h-8 bg-gray-200 rounded-lg"></div>
    <div className="w-10 h-8 bg-gray-200 rounded-lg"></div>
    <div className="w-10 h-8 bg-gray-200 rounded-lg"></div>
    <div className="ml-auto w-10 h-8 bg-gray-200 rounded-lg"></div>
  </div>
);

const ContentSkeleton = () => (
  <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 animate-pulse">
    <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
    <div className="w-48 h-6 bg-gray-200 rounded mb-2"></div>
    <div className="w-64 h-4 bg-gray-200 rounded"></div>
  </div>
);

const FormSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
    <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
    <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
    <div className="w-full h-10 bg-gray-200 rounded-lg mt-4"></div>
  </div>
);

interface LazyLoadedPageProps {
  children: React.ReactNode;
}

export function LazyLoadedPage({ children }: LazyLoadedPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Dar tiempo a que la UI se renderice antes de mostrar el contenido completo
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 overflow-y-auto p-6 border-r">
          <div className="flex justify-between items-center mb-6">
            <div className="w-40 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex gap-2">
              <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
          
          <ToolbarSkeleton />
          <ContentSkeleton />
        </div>
        
        <div className="w-[400px] p-6 overflow-y-auto bg-gray-50">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="w-48 h-8 bg-gray-200 rounded-lg mb-6 animate-pulse"></div>
            <FormSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600">Cargando página...</p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
} 