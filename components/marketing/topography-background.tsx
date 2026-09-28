'use client';

import React, { useEffect, useRef } from 'react';

interface TopographyBackgroundProps {
  className?: string;
}

// Simplex/Perlin noise helper for smooth topography contours
function createNoise2D() {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = Math.floor(Math.random() * 256);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  function grad2(hash: number, x: number, y: number) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  return function noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);

    const g00 = grad2(perm[X + perm[Y]], xf, yf);
    const g10 = grad2(perm[X + 1 + perm[Y]], xf - 1, yf);
    const g01 = grad2(perm[X + perm[Y + 1]], xf, yf - 1);
    const g11 = grad2(perm[X + 1 + perm[Y + 1]], xf - 1, yf - 1);

    const x1 = g00 + u * (g10 - g00);
    const x2 = g01 + u * (g11 - g01);

    return x1 + v * (x2 - x1);
  };
}

export function TopographyBackground({
  className = '',
}: TopographyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;
    let time = 0;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const noise2D = createNoise2D();

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const stepSize = 18;
    const scale = 0.0035;

    const render = () => {
      if (!ctx || !canvas) return;

      if (!prefersReducedMotion) {
        time += 0.0012;
      }

      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');
      const baseAlpha = isDark ? 0.08 : 0.05;
      const strokeStyleBase = isDark ? `rgba(255, 255, 255, ${baseAlpha})` : `rgba(0, 0, 0, ${baseAlpha})`;
      const accentStrokeStyle = `rgba(59, 130, 246, ${isDark ? 0.35 : 0.25})`; // Restrained electric blue accent

      const rows = Math.ceil(height / stepSize) + 1;
      const cols = Math.ceil(width / stepSize) + 1;

      // Draw topography contour lines
      for (let y = 0; y < rows; y++) {
        ctx.beginPath();
        let isStarted = false;

        for (let x = 0; x < cols; x++) {
          const px = x * stepSize;
          const py = y * stepSize;

          // Mouse displacement
          const dx = px - mouseX;
          const dy = py - mouseY;
          const distSq = dx * dx + dy * dy;
          const mouseEffect = Math.max(0, 1 - Math.sqrt(distSq) / 240);

          const n = noise2D(px * scale + time * 0.4, py * scale + time * 0.4);
          const offsetY = n * 16 + mouseEffect * 12;

          const finalY = py + offsetY;

          if (!isStarted) {
            ctx.moveTo(px, finalY);
            isStarted = true;
          } else {
            ctx.lineTo(px, finalY);
          }
        }

        const lineMidY = y * stepSize;
        const distToMouse = Math.abs(lineMidY - mouseY);
        const isNearMouse = mouseX > 0 && distToMouse < 160;

        ctx.strokeStyle = isNearMouse ? accentStrokeStyle : strokeStyleBase;
        ctx.lineWidth = isNearMouse ? 1.2 : 0.75;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full pointer-events-none" />
    </div>
  );
}
