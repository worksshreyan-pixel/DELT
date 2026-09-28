'use client';

import React, { useEffect, useRef } from 'react';

interface WebThreadsBackgroundProps {
  className?: string;
}

interface WebNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
  radius: number;
  pulsePhase: number;
}

export function WebThreadsBackground({ className = '' }: WebThreadsBackgroundProps) {
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
    let scrollY = 0;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);

    let nodes: WebNode[] = [];

    const initNodes = () => {
      nodes = [];
      // Sparse node density for clean negative space
      const densityFactor = isMobile ? 0.00003 : 0.000065;
      const count = Math.min(isMobile ? 25 : 65, Math.floor(width * height * densityFactor));

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        nodes.push({
          x,
          y,
          originX: x,
          originY: y,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          radius: Math.random() * 1.5 + 1,
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
      initNodes();
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
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

    let startTime = performance.now();

    const maxDist = isMobile ? 120 : 160;
    const maxDistSq = maxDist * maxDist;

    const render = (now: number) => {
      if (!ctx || !canvas) return;

      const elapsed = (now - startTime) * 0.001;

      if (!isMobile) {
        mouseX += (targetMouseX - mouseX) * 0.06;
        mouseY += (targetMouseY - mouseY) * 0.06;
      }

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');

      // Calculate section intensity multiplier based on scroll position
      let sectionMultiplier = 1.0;
      if (scrollY > 2200 && scrollY < 3400) {
        // Security section: almost black negative space
        sectionMultiplier = 0.2;
      } else if (scrollY > 600 && scrollY <= 2200) {
        // Workflow / Demos: quiet sparse lines
        sectionMultiplier = 0.55;
      } else if (scrollY >= 3400) {
        // Final CTA: subtle return
        sectionMultiplier = 0.75;
      }

      const baseLineAlpha = (isDark ? 0.08 : 0.05) * sectionMultiplier;
      const baseNodeAlpha = (isDark ? 0.22 : 0.15) * sectionMultiplier;

      // Update & render nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        if (!prefersReducedMotion) {
          // Slow ambient drift
          n.x += n.vx;
          n.y += n.vy;

          // Soft boundary bounce
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;

          // Subtle cursor displacement
          if (!isMobile && mouseX > 0) {
            const dx = mouseX - n.x;
            const dy = mouseY - n.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 22500 && distSq > 0) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / 150) * 0.8;
              n.x -= (dx / dist) * force;
              n.y -= (dy / dist) * force;
            }
          }
        }

        // Draw node point
        const pulse = prefersReducedMotion ? 0 : Math.sin(elapsed * 1.2 + n.pulsePhase) * 0.3;
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${baseNodeAlpha + pulse * 0.05})`
          : `rgba(0, 0, 0, ${baseNodeAlpha + pulse * 0.05})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw connective web threads between nodes within maxDist
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const factor = 1 - dist / maxDist;

            // Check proximity to cursor for electric blue accent highlight (#3B82F6)
            let isMouseNear = false;
            if (!isMobile && mouseX > 0) {
              const midX = (n1.x + n2.x) / 2;
              const midY = (n1.y + n2.y) / 2;
              const mdx = mouseX - midX;
              const mdy = mouseY - midY;
              if (mdx * mdx + mdy * mdy < 14400) {
                isMouseNear = true;
              }
            }

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);

            if (isMouseNear) {
              ctx.strokeStyle = `rgba(59, 130, 246, ${Math.min(0.35, factor * 0.4 * sectionMultiplier)})`;
              ctx.lineWidth = 1.2;
            } else {
              const lineAlpha = factor * baseLineAlpha;
              ctx.strokeStyle = isDark
                ? `rgba(255, 255, 255, ${lineAlpha})`
                : `rgba(0, 0, 0, ${lineAlpha})`;
              ctx.lineWidth = 0.75;
            }

            ctx.stroke();
          }
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
