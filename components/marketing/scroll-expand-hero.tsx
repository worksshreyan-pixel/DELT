'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface ScrollExpandHeroProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollExpandHero({ children, className = '' }: ScrollExpandHeroProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 24,
    restDelta: 0.001,
  });

  // Scale smoothly expands as user scrolls down through the hero section
  const scale = useTransform(smoothProgress, [0.1, 0.45], [0.92, 1.0]);
  const opacity = useTransform(smoothProgress, [0.05, 0.25], [0.75, 1]);
  const shadowSpread = useTransform(smoothProgress, [0.1, 0.45], ['0px 10px 35px rgba(0,0,0,0.4)', '0px 25px 60px rgba(59,130,246,0.15)']);

  return (
    <div ref={containerRef} className={`relative w-full py-4 ${className}`}>
      <motion.div
        style={{
          scale,
          opacity,
          boxShadow: shadowSpread,
        }}
        className="mx-auto w-full max-w-5xl rounded-2xl transition-shadow duration-300"
      >
        {children}
      </motion.div>
    </div>
  );
}
