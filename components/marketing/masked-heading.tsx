'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MaskedHeadingProps {
  lines: string[];
  className?: string;
  delay?: number;
  highlightLast?: boolean;
}

export function MaskedHeading({
  lines,
  className = '',
  delay = 0,
  highlightLast = false,
}: MaskedHeadingProps) {
  return (
    <h1 className={cn('font-display font-semibold tracking-tight text-4xl sm:text-5xl md:text-6xl leading-[1.1]', className)}>
      {lines.map((line, idx) => {
        const isLast = highlightLast && idx === lines.length - 1;
        return (
          <div key={idx} className="block overflow-hidden py-0.5">
            <motion.span
              className={cn(
                'inline-block',
                isLast && 'text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-amber-500'
              )}
              initial={{ y: '105%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{
                duration: 0.7,
                delay: delay + idx * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {line}
            </motion.span>
          </div>
        );
      })}
    </h1>
  );
}
