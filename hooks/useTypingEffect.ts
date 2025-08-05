import { useState, useCallback, useRef } from 'react';

export type LoadingState = 'idle' | 'generating' | 'typing';

export function useTypingEffect() {
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingSpeed, setTypingSpeed] = useState<number>(30);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const typingInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentIndex = useRef<number>(0);

  const startTypingEffect = useCallback((text: string) => {
    setIsTyping(true);
    currentIndex.current = 0;
    setDisplayedText('');

    typingInterval.current = setInterval(() => {
      if (currentIndex.current < text.length) {
        setDisplayedText(prev => prev + text[currentIndex.current]);
        currentIndex.current += 1;
      } else {
        if (typingInterval.current) {
          clearInterval(typingInterval.current);
        }
        setIsTyping(false);
      }
    }, typingSpeed);
  }, [typingSpeed]);

  const stopTypingAnimation = useCallback(() => {
    if (typingInterval.current) {
      clearInterval(typingInterval.current);
    }
    setIsTyping(false);
  }, []);

  const changeTypingSpeed = useCallback((speed: number) => {
    setTypingSpeed(speed);
    if (isTyping && typingInterval.current) {
      clearInterval(typingInterval.current);
      startTypingEffect(displayedText);
    }
  }, [isTyping, displayedText, startTypingEffect]);

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