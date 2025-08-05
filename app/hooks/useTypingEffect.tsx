import { useState, useRef, useEffect } from "react";

type LoadingState = 'idle' | 'generating' | 'typing';

interface UseTypingEffectOptions {
  initialSpeed?: number;
}

interface UseTypingEffectReturn {
  displayedText: string;
  isTyping: boolean;
  typingSpeed: number;
  loadingState: LoadingState;
  setLoadingState: (state: LoadingState) => void;
  startTypingEffect: (text: string) => void;
  stopTypingAnimation: () => void;
  changeTypingSpeed: (speed: number) => void;
}

export default function useTypingEffect(options?: UseTypingEffectOptions): UseTypingEffectReturn {
  const [rawText, setRawText] = useState<string>("");
  const [displayedText, setDisplayedText] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(options?.initialSpeed || 20); // Valor predeterminado
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar el timeout cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Función para realizar el efecto de escritura caracter por caracter preservando HTML
  const startTypingEffect = (text: string) => {
    setRawText(text);
    setIsTyping(true);
    setDisplayedText("");
    
    let i = 0;
    const totalLength = text.length;
    
    // Función recursiva para mostrar texto caracter por caracter
    const typeNextChunk = () => {
      if (i < totalLength) {
        // Tomar 5-10 caracteres a la vez para un efecto más rápido
        const chunkSize = Math.floor(Math.random() * 6) + 5; // 5-10 caracteres
        const end = Math.min(i + chunkSize, totalLength);
        const chunk = text.substring(i, end);
        
        setDisplayedText(prevText => prevText + chunk);
        i = end;
        
        // Calcular velocidad variable para parecer más natural
        // Ir más rápido en general, pero hacer pausas en puntuación
        let delay = typingSpeed;
        if (/[.!?]\s*$/.test(chunk)) {
          delay = typingSpeed * 3; // Pausa en puntos, signos de exclamación o interrogación
        }
        
        typingTimeoutRef.current = setTimeout(typeNextChunk, delay);
      } else {
        // Finalizar efecto de escritura
        setIsTyping(false);
        setLoadingState('idle');
      }
    };
    
    // Iniciar efecto
    typeNextChunk();
  };

  // Función para detener la animación de tipeo
  const stopTypingAnimation = () => {
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
      setLoadingState('idle');
      setDisplayedText(rawText);
    }
  };

  const changeTypingSpeed = (speed: number) => {
    setTypingSpeed(speed);
  };

  return {
    displayedText,
    isTyping,
    typingSpeed,
    loadingState,
    setLoadingState,
    startTypingEffect,
    stopTypingAnimation,
    changeTypingSpeed
  };
} 