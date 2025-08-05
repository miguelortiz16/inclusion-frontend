import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { loadJsPDF } from './lazy-components';

interface PDFExporterProps {
  generatePDF: (jsPDF: any) => Promise<void>;
  filename?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PDFExporter({ generatePDF, children, disabled = false }: PDFExporterProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (disabled) return;
    
    setLoading(true);
    try {
      // Usar la función centralizada para cargar jsPDF
      const jsPDF = await loadJsPDF();
      
      await generatePDF(jsPDF);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error("Error al exportar el documento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={handleExport} className={disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}>
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          <span>Exportando...</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
} 