'use client';

import React, { useEffect, useRef } from 'react';

interface GalaxyBackgroundProps {
  className?: string;
  intensity?: number;
}

interface StarParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  baseAlpha: number;
  isBlue: boolean;
  pulseSpeed: number;
  pulsePhase: number;
}

export function GalaxyBackground({ className = '', intensity = 1.0 }: GalaxyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let scrollY = 0;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);

    let stars: StarParticle[] = [];
    const FOV = 400;
    const MAX_DEPTH = 1200;

    const initStars = () => {
      stars = [];
      const count = isMobile ? 120 : 280;

      for (let i = 0; i < count; i++) {
        stars.push({
          x: (Math.random() - 0.5) * width * 2.2,
          y: (Math.random() - 0.5) * height * 2.2,
          z: Math.random() * MAX_DEPTH + 10,
          size: Math.random() * 1.8 + 0.6,
          baseAlpha: Math.random() * 0.5 + 0.3,
          isBlue: Math.random() < 0.35, // 35% electric blue tinted stars
          pulseSpeed: Math.random() * 1.5 + 0.5,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

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
      initStars();
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      targetMouseX = (e.clientX - width / 2) * 0.15;
      targetMouseY = (e.clientY - height / 2) * 0.15;
    };

    const handleMouseLeave = () => {
      targetMouseX = 0;
      targetMouseY = 0;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseleave', handleMouseLeave);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    let rotationAngle = 0;
    const startTime = performance.now();

    const render = (now: number) => {
      if (!ctx || !canvas) return;

      const elapsed = (now - startTime) * 0.001;

      if (!isMobile && !prefersReducedMotion) {
        mouseX += (targetMouseX - mouseX) * 0.04;
        mouseY += (targetMouseY - mouseY) * 0.04;
        rotationAngle += 0.0003;
      }

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');

      // Section intensity scale multiplied by page-level intensity prop
      let currentIntensity = intensity;
      if (scrollY > 2200 && scrollY < 3400) {
        currentIntensity = 0.25 * intensity; // Security: minimal dark space
      } else if (scrollY > 700 && scrollY <= 2200) {
        currentIntensity = 0.55 * intensity; // Workflow / Demos: medium-low
      } else if (scrollY >= 3400) {
        currentIntensity = 0.75 * intensity; // Final CTA: subtle return
      }
      const activeIntensity = currentIntensity;

      const centerX = width / 2 + mouseX;
      const centerY = height / 2 + mouseY;

      // Render DELT Electric Blue Atmospheric Depth Gloom behind galaxy field
      if (isDark) {
        // Deep top-right / hero outer glow region
        const heroGlow = ctx.createRadialGradient(
          width * 0.75 + mouseX * 0.5,
          height * 0.25 + mouseY * 0.5,
          10,
          width * 0.75 + mouseX * 0.5,
          height * 0.25 + mouseY * 0.5,
          width * 0.6
        );
        heroGlow.addColorStop(0, `rgba(59, 130, 246, ${0.12 * activeIntensity})`);
        heroGlow.addColorStop(0.5, `rgba(15, 30, 70, ${0.08 * activeIntensity})`);
        heroGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = heroGlow;
        ctx.fillRect(0, 0, width, height);

        // Subdued bottom-left spatial depth glow
        const subGlow = ctx.createRadialGradient(
          width * 0.2,
          height * 0.7,
          20,
          width * 0.2,
          height * 0.7,
          width * 0.5
        );
        subGlow.addColorStop(0, `rgba(37, 99, 235, ${0.08 * activeIntensity})`);
        subGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = subGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw 3D Spatial Star Field
      const cosR = Math.cos(rotationAngle);
      const sinR = Math.sin(rotationAngle);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        if (!prefersReducedMotion) {
          // Slow depth drift
          s.z -= 0.6;
          if (s.z <= 1) {
            s.z = MAX_DEPTH;
            s.x = (Math.random() - 0.5) * width * 2.2;
            s.y = (Math.random() - 0.5) * height * 2.2;
          }
        }

        // Apply slight rotation transform
        const rx = s.x * cosR - s.y * sinR;
        const ry = s.x * sinR + s.y * cosR;

        // 3D Perspective Projection
        const k = FOV / (s.z + FOV);
        const px = rx * k + centerX;
        const py = ry * k + centerY;

        if (px >= -20 && px <= width + 20 && py >= -20 && py <= height + 20) {
          const depthScale = Math.max(0.2, 1 - s.z / MAX_DEPTH);
          const pulse = prefersReducedMotion ? 0 : Math.sin(elapsed * s.pulseSpeed + s.pulsePhase) * 0.2;
          const alpha = Math.min(1, (s.baseAlpha + pulse) * depthScale * activeIntensity);
          const size = s.size * (k * 1.5);

          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);

          if (s.isBlue) {
            ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
            ctx.shadowBlur = size * 3;
          } else {
            ctx.fillStyle = isDark
              ? `rgba(225, 235, 255, ${alpha})`
              : `rgba(20, 30, 50, ${alpha * 0.8})`;
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render(performance.now());
    } else {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
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
