import React, { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTypingEffect } from './useTypingEffect';

interface TypingEffectProps {
  content: string;
  isLoading: boolean;
  onContentChange?: (content: string) => void;
  placeholder?: React.ReactNode;
  minHeight?: string;
  loadingMessage?: string;
  typingMessage?: string;
}

export default function TypingEffect({
  content,
  isLoading,
  onContentChange,
  placeholder,
  minHeight = "500px",
  loadingMessage = "Generando contenido...",
  typingMessage = "Escribiendo..."
}: TypingEffectProps) {
  const {
    displayedText,
    isTyping,
    typingSpeed,
    loadingState,
    setLoadingState,
    startTypingEffect,
    stopTypingAnimation,
    changeTypingSpeed
  } = useTypingEffect();
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Iniciar efecto de escritura cuando cambia el contenido
  React.useEffect(() => {
    if (content && !isTyping && loadingState === 'generating') {
      setLoadingState('typing');
      startTypingEffect(content);
    }
  }, [content, isTyping, loadingState, setLoadingState, startTypingEffect]);

  // Actualizar el estado de carga cuando isLoading cambia
  React.useEffect(() => {
    if (isLoading && loadingState === 'idle') {
      setLoadingState('generating');
    }
  }, [isLoading, loadingState, setLoadingState]);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    if (!isTyping && onContentChange) {
      onContentChange(e.currentTarget.innerHTML);
    }
  };

  return (
    <div className="relative">
      <div className="mb-6 flex items-center gap-2">
        {isTyping && (
          <>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={stopTypingAnimation}
            >
              Mostrar todo
            </Button>
            <div className="flex items-center ml-2">
              <label className="text-xs text-gray-500 mr-2">Velocidad:</label>
              <select 
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white"
                onChange={(e) => changeTypingSpeed(Number(e.target.value))}
                value={typingSpeed}
              >
                <option value="50">Lenta</option>
                <option value="30">Normal</option>
                <option value="20">Rápida</option>
                <option value="10">Muy rápida</option>
              </select>
            </div>
          </>
        )}
      </div>

      {loadingState === 'generating' ? (
        <div className={`border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center`} style={{ minHeight }}>
          <div className="flex flex-col items-center p-8 rounded-lg bg-white shadow-sm">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{loadingMessage}</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Nuestro sistema está creando contenido personalizado basado en la información proporcionada.
              Esto puede tomar unos momentos.
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={previewRef}
          className={`focus:outline-none border border-dashed border-gray-300 rounded-lg p-6 text-gray-700 whitespace-pre-wrap font-sans relative`}
          style={{ minHeight }}
          contentEditable={!isTyping}
          onInput={handleContentChange}
          suppressContentEditableWarning
        >
          {isTyping ? (
            <>
              <div dangerouslySetInnerHTML={{ __html: displayedText }} />
              <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>
            </>
          ) : content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            placeholder || (
              <div className="text-gray-400">
                El contenido generado aparecerá aquí...
              </div>
            )
          )}
        </div>
      )}

      {loadingState === 'typing' && (
        <div className="absolute bottom-4 right-4 p-2 bg-white rounded-md shadow-sm flex items-center gap-2 z-10">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">{typingMessage}</span>
        </div>
      )}
    </div>
  );
} 