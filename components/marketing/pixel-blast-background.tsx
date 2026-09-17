'use client';

import React, { useEffect, useRef } from 'react';

interface PixelBlastProps {
  pixelSize?: number;
  gap?: number;
  className?: string;
}

export function PixelBlastBackground({
  pixelSize = 4,
  gap = 24,
  className = '',
}: PixelBlastProps) {
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

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Particle grid array
    interface PixelParticle {
      originX: number;
      originY: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseAlpha: number;
      size: number;
      phase: number;
    }

    let particles: PixelParticle[] = [];

    const initParticles = () => {
      particles = [];
      const cols = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gap;
          const y = j * gap;
          particles.push({
            originX: x,
            originY: y,
            x,
            y,
            vx: 0,
            vy: 0,
            baseAlpha: 0.12 + (Math.sin(i * 0.7 + j * 0.5) * 0.05 + 0.05),
            size: pixelSize + (Math.random() > 0.8 ? 1.5 : 0),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      initParticles();
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

    const startTime = performance.now();

    const render = (now: number) => {
      if (!ctx || !canvas) return;

      const elapsed = (now - startTime) * 0.001;

      mouseX += (targetMouseX - mouseX) * 0.12;
      mouseY += (targetMouseY - mouseY) * 0.12;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');
      const baseRgb = isDark ? '220, 225, 235' : '60, 65, 80';
      const blastRgb = isDark ? '245, 158, 11' : '217, 119, 6'; // Warm amber

      const blastRadius = 150;
      const blastForce = 18;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Ambient sine floating
        const ambientOffset = prefersReducedMotion
          ? 0
          : Math.sin(elapsed * 1.5 + p.phase) * 1.5;

        const targetX = p.originX;
        const targetY = p.originY + ambientOffset;

        // Mouse blast dispersion
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist < blastRadius && dist > 0) {
          const factor = (1 - dist / blastRadius);
          const push = factor * blastForce;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * push * 0.2;
          p.vy -= Math.sin(angle) * push * 0.2;
        }

        // Physics spring return to origin
        p.vx += (targetX - p.x) * 0.08;
        p.vy += (targetY - p.y) * 0.08;
        p.vx *= 0.82;
        p.vy *= 0.82;

        p.x += p.vx;
        p.y += p.vy;

        // Blast color & alpha calculation
        let alpha = p.baseAlpha;
        let fillStyle = `rgba(${baseRgb}, ${alpha})`;

        if (dist < blastRadius) {
          const factor = 1 - dist / blastRadius;
          const blastAlpha = Math.min(0.85, alpha + factor * 0.65);
          fillStyle = `rgba(${blastRgb}, ${blastAlpha})`;
        }

        // Draw pixel rect block
        ctx.fillStyle = fillStyle;
        ctx.fillRect(
          Math.round(p.x - p.size / 2),
          Math.round(p.y - p.size / 2),
          p.size,
          p.size
        );
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [pixelSize, gap]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full pointer-events-none opacity-85" />
    </div>
  );
}
