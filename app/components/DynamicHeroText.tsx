'use client';

import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { heroTexts } from "./hero-texts";

export const DynamicHeroText = () => {
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState(heroTexts[0]);

  useEffect(() => {
    setMounted(true);
    const randomIndex = Math.floor(Math.random() * heroTexts.length);
    setText(heroTexts[randomIndex]);
  }, []);

  return (
    <span className="relative inline-block" suppressHydrationWarning>
      <span className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-sky-300/20 to-blue-400/20 rounded-lg blur-lg group-hover:blur-xl transition-all duration-300 animate-pulse"></span>
      <span className="relative flex flex-col sm:flex-row items-center gap-2 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wide bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-500 animate-bounce-slow" />
        {mounted ? text : heroTexts[0]}
      </span>
    </span>
  );
}; 