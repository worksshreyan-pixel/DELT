'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, X, Loader2, Check } from 'lucide-react';

interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onSave: (croppedBlob: Blob) => Promise<void>;
  isUploading: boolean;
}

export function AvatarCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  isUploading,
}: AvatarCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport mask diameter inside crop modal
  const MASK_SIZE = 240;

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      setImgElement(null);
      setPreviewDataUrl(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Calculate base scale so image fills the circular mask
  const getBaseScale = useCallback(() => {
    if (!imgElement) return 1;
    return Math.max(MASK_SIZE / imgElement.width, MASK_SIZE / imgElement.height);
  }, [imgElement]);

  // Constrain panning offset to keep image covering the crop circle
  const clampOffset = useCallback(
    (newX: number, newY: number, currentZoom: number) => {
      if (!imgElement) return { x: 0, y: 0 };
      const baseScale = getBaseScale();
      const scale = baseScale * currentZoom;
      const scaledWidth = imgElement.width * scale;
      const scaledHeight = imgElement.height * scale;

      const maxX = Math.max(0, (scaledWidth - MASK_SIZE) / 2);
      const maxY = Math.max(0, (scaledHeight - MASK_SIZE) / 2);

      return {
        x: Math.min(maxX, Math.max(-maxX, newX)),
        y: Math.min(maxY, Math.max(-maxY, newY)),
      };
    },
    [imgElement, getBaseScale]
  );

  // Update offset when zoom decreases to prevent edge whitespace
  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom));
  }, [zoom, clampOffset]);

  // Render crop canvas preview
  const generateCroppedCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!imgElement) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const baseScale = getBaseScale();
    const scale = baseScale * zoom;

    // Calculate source rect in original image space
    const srcSize = MASK_SIZE / scale;
    const srcX = imgElement.width / 2 - offset.x / scale - srcSize / 2;
    const srcY = imgElement.height / 2 - offset.y / scale - srcSize / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgElement, srcX, srcY, srcSize, srcSize, 0, 0, 512, 512);

    return canvas;
  }, [imgElement, getBaseScale, zoom, offset]);

  // Generate preview Data URL for live preview
  useEffect(() => {
    if (!isOpen || !imgElement) return;
    const canvas = generateCroppedCanvas();
    if (canvas) {
      setPreviewDataUrl(canvas.toDataURL('image/png'));
    }
  }, [isOpen, imgElement, zoom, offset, generateCroppedCanvas]);

  // Drag / Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    setOffset(clampOffset(rawX, rawY, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rawX = touch.clientX - dragStart.x;
    const rawY = touch.clientY - dragStart.y;
    setOffset(clampOffset(rawX, rawY, zoom));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(1, Math.round((prev + delta) * 100) / 100)));
  };

  // Reset to initial
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Save Avatar handler
  const handleSave = async () => {
    const canvas = generateCroppedCanvas();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (blob) {
        await onSave(blob);
      }
    }, 'image/png');
  };

  if (!isOpen || !imageSrc) return null;

  const baseScale = getBaseScale();
  const effectiveScale = baseScale * zoom;
  const scaledWidth = imgElement ? imgElement.width * effectiveScale : MASK_SIZE;
  const scaledHeight = imgElement ? imgElement.height * effectiveScale : MASK_SIZE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Crop avatar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Drag to reposition, use slider to zoom</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="flex flex-col items-center gap-4">
          <div
            ref={containerRef}
            className="relative h-[260px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-900 select-none cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Image Layer */}
            {imgElement && (
              <img
                src={imageSrc}
                alt="Avatar to crop"
                style={{
                  width: `${scaledWidth}px`,
                  height: `${scaledHeight}px`,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                }}
                className="pointer-events-none transition-transform duration-75 ease-out"
              />
            )}

            {/* Circular Mask Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                style={{ width: `${MASK_SIZE}px`, height: `${MASK_SIZE}px` }}
                className="rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.75)]"
              />
            </div>
          </div>

          {/* Controls: Zoom & Reset */}
          <div className="flex items-center justify-between w-full px-2 gap-3">
            <div className="flex items-center gap-2 flex-1">
              <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                disabled={isUploading}
                className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isUploading}
              className="h-8 text-xs gap-1.5 shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>

          {/* Live Preview */}
          {previewDataUrl && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/50 w-full justify-center">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <div className="h-10 w-10 rounded-full overflow-hidden border border-border shadow-sm">
                <img src={previewDataUrl} alt="Crop Preview" className="h-full w-full object-cover" />
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isUploading || !imgElement}
            className="min-w-[110px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Save avatar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
