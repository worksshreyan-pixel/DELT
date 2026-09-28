'use client';

import { GalaxyBackground } from './galaxy-background';

interface PixelBlastProps {
  pixelSize?: number;
  gap?: number;
  className?: string;
  intensity?: number;
}

export function PixelBlastBackground(props: PixelBlastProps) {
  return <GalaxyBackground className={props.className} intensity={props.intensity} />;
}

