"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface TypingEffectProps {
  content: string;
  isLoading: boolean;
  onContentChange: (content: string) => void;
  loadingMessage?: string;
  typingMessage?: string;
}

const TypingEffect: React.FC<TypingEffectProps> = ({
  content,
  isLoading,
  onContentChange,
  loadingMessage = "Generando contenido...",
  typingMessage = "Escribiendo..."
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (content && !isLoading) {
      setIsTyping(true);
      setDisplayedText('');
      typeText(content);
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, isLoading]);

  const typeText = (text: string) => {
    let i = 0;
    const typeNextChunk = () => {
      if (i < text.length) {
        const chunkSize = 5;
        const end = Math.min(i + chunkSize, text.length);
        const chunk = text.substring(i, end);
        
        setDisplayedText(prev => prev + chunk);
        i = end;
        
        let delay = 20;
        if (/[.!?]\s*$/.test(chunk)) {
          delay = 60;
        }
        
        typingTimeoutRef.current = setTimeout(typeNextChunk, delay);
      } else {
        setIsTyping(false);
        onContentChange(text);
      }
    };
    
    typeNextChunk();
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    if (!isTyping && onContentChange) {
      onContentChange(e.currentTarget.innerHTML);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
        <div className="flex flex-col items-center p-8 rounded-lg bg-white shadow-sm">
          <div className="h-12 w-12 border-4 border-blue-500 rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{loadingMessage}</h3>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Nuestro sistema está procesando tu solicitud. Esto puede tomar unos momentos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className="min-h-[500px] focus:outline-none border border-dashed border-gray-300 rounded-lg p-6 text-gray-700 whitespace-pre-wrap font-sans"
        contentEditable={!isTyping}
        onInput={handleContentChange}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: displayedText }}
      />
      {isTyping && (
        <div className="absolute bottom-4 right-4 p-2 bg-white rounded-md shadow-sm flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">{typingMessage}</span>
        </div>
      )}
    </div>
  );
};

export default TypingEffect;

export { LoadingButton } from './loading-button'; 