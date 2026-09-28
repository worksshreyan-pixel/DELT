'use client';

import React, { useRef, useEffect, useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CodeSlotsStatus = 'idle' | 'error' | 'success';

export interface CodeSlotsProps {
  value: string[] | string;
  onChange: (value: any) => void;
  onComplete?: (code: string) => void;
  status?: CodeSlotsStatus;
  disabled?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  isLoading?: boolean;
  autoFocus?: boolean;
  length?: number;
  slotSize?: number | string;
  gap?: number | string;
  radius?: number | string;
  accentColor?: string;
  dangerColor?: string;
  className?: string;
  containerClassName?: string;
}

export function CodeSlots({
  value,
  onChange,
  onComplete,
  status,
  disabled = false,
  isError = false,
  isSuccess = false,
  isLoading = false,
  autoFocus = true,
  length = 6,
  accentColor = '#3B82F6',
  dangerColor = '#EF4444',
  className = '',
  containerClassName = '',
}: CodeSlotsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const caretId = useId();

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDraining, setIsDraining] = useState(false);
  const [isPasted, setIsPasted] = useState(false);

  // Determine active status (prefer status prop, fall back to legacy booleans)
  const activeStatus: CodeSlotsStatus = status
    ? status
    : isSuccess
    ? 'success'
    : isError
    ? 'error'
    : 'idle';

  // Normalize controlled value to string of digits
  const rawString = Array.isArray(value)
    ? value.join('')
    : typeof value === 'string'
    ? value
    : '';

  const cleanValue = rawString.replace(/[^0-9]/g, '').slice(0, length);
  const digitsArray: string[] = Array.from({ length }, (_, i) => cleanValue[i] || '');

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle error state reverse-draining animation
  useEffect(() => {
    if (activeStatus === 'error' && !isDraining && cleanValue.length > 0) {
      setIsDraining(true);
      const drainDuration = reducedMotion ? 50 : length * 60 + 220;
      const timer = setTimeout(() => {
        setIsDraining(false);
        // Clear value after draining complete
        updateOtp('');
        if (inputRef.current) {
          inputRef.current.focus();
          setFocusedIndex(0);
        }
      }, drainDuration);
      return () => clearTimeout(timer);
    }
  }, [activeStatus]);

  // Auto-focus input on mount
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled && !isLoading && activeStatus !== 'success') {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled, isLoading, activeStatus]);

  const updateOtp = (newStr: string) => {
    if (Array.isArray(value)) {
      const arr = Array.from({ length }, (_, i) => newStr[i] || '');
      onChange(arr);
    } else {
      onChange(newStr);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isLoading || activeStatus === 'success' || isDraining) return;

    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, length);
    setIsPasted(false);
    updateOtp(val);

    const nextIndex = Math.min(val.length, length - 1);
    setFocusedIndex(nextIndex);

    if (val.length === length && onComplete) {
      onComplete(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || isLoading || activeStatus === 'success') return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev !== null && prev < length - 1 ? prev + 1 : length - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedIndex(cleanValue.length > 0 ? Math.min(cleanValue.length, length - 1) : 0);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled || isLoading || activeStatus === 'success') return;

    const pastedData = e.clipboardData.getData('text/plain').trim();
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, length);

    if (!digits) return;

    setIsPasted(true);
    updateOtp(digits);

    const targetIdx = Math.min(digits.length, length - 1);
    setFocusedIndex(targetIdx);

    if (digits.length === length && onComplete) {
      onComplete(digits);
    }
  };

  const handleSlotClick = (idx: number) => {
    if (disabled || isLoading || activeStatus === 'success') return;
    if (inputRef.current) {
      inputRef.current.focus();
      const clickIdx = Math.min(idx, cleanValue.length);
      setFocusedIndex(clickIdx);
      try {
        inputRef.current.setSelectionRange(clickIdx, clickIdx);
      } catch (err) {
        // Fallback for selection range
      }
    }
  };

  const activeCaretSlot =
    isFocused &&
    !disabled &&
    !isLoading &&
    activeStatus === 'idle' &&
    focusedIndex !== null
      ? focusedIndex
      : null;

  return (
    <div data-testid="delt-reactbits-codeslots" className={cn('relative inline-flex flex-col items-center justify-center select-none', containerClassName)}>
      {/* Hidden Native Input Layer for Accessibility & Mobile Devices */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={length}
        value={cleanValue}
        disabled={disabled || isLoading || activeStatus === 'success'}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => {
          setIsFocused(true);
          if (focusedIndex === null) {
            setFocusedIndex(Math.min(cleanValue.length, length - 1));
          }
        }}
        onBlur={() => {
          setIsFocused(false);
          setFocusedIndex(null);
        }}
        aria-label={`Enter ${length}-digit verification code`}
        aria-invalid={activeStatus === 'error'}
        aria-disabled={disabled || isLoading}
        className="absolute inset-0 h-full w-full opacity-0 z-20 cursor-pointer disabled:cursor-not-allowed"
      />

      {/* Visual Slot Row */}
      <div className="relative flex items-center justify-center gap-2 sm:gap-2.5">
        {/* Success Wash Expansion Overlay */}
        {activeStatus === 'success' && (
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { scaleX: 0, opacity: 0 }}
            animate={reducedMotion ? { opacity: 1 } : { scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 z-10 flex items-center justify-center"
          >
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { scale: 0, rotate: -25 }}
              animate={reducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.12 }}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500 text-black shadow-lg"
            >
              <Check className="h-5 w-5 stroke-[3]" />
            </motion.div>
          </motion.div>
        )}

        {Array.from({ length }).map((_, idx) => {
          const digit = digitsArray[idx] || '';
          const isFilled = digit.length > 0;
          const isCurrentSlotFocused = activeCaretSlot === idx;

          // Cascade delay timing for pasted digits or reverse draining
          const cascadeDelay = isDraining
            ? (length - 1 - idx) * 0.05
            : isPasted
            ? idx * 0.04
            : 0;

          return (
            <div
              key={idx}
              onClick={() => handleSlotClick(idx)}
              className={cn(
                'relative flex h-12 w-10 sm:h-13 sm:w-11 items-center justify-center rounded-xl border text-center font-mono font-bold text-lg sm:text-xl shadow-xs transition-all duration-200 overflow-hidden',
                'bg-card/90 text-foreground border-border/80',
                isCurrentSlotFocused &&
                  'border-accent-brand ring-4 ring-accent-brand/20 shadow-[0_0_14px_rgba(59,130,246,0.35)]',
                isFilled && !isCurrentSlotFocused && 'border-accent-brand/60 bg-accent-brand/5 text-foreground',
                activeStatus === 'error' &&
                  'border-destructive/80 bg-destructive/10 text-destructive',
                activeStatus === 'success' &&
                  'border-emerald-500/60 bg-emerald-500/10 text-emerald-400',
                (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
                className
              )}
            >
              {/* Slot Active Caret Indicator */}
              {isCurrentSlotFocused && !isFilled && activeStatus !== 'success' && (
                <motion.span
                  layoutId={reducedMotion ? undefined : caretId}
                  animate={reducedMotion ? { opacity: 1 } : { opacity: [1, 0.15, 1] }}
                  transition={
                    reducedMotion
                      ? { duration: 0.1 }
                      : { repeat: Infinity, duration: 0.95, ease: 'easeInOut' }
                  }
                  className="h-5 w-0.5 rounded-full bg-accent-brand shadow-[0_0_8px_#3B82F6]"
                />
              )}

              {/* Digit Landing & Draining Animation */}
              <AnimatePresence mode="wait">
                {isFilled && (
                  <motion.span
                    key={`${idx}-${digit}`}
                    initial={
                      reducedMotion
                        ? { opacity: 0 }
                        : { y: 16, scale: 0.6, opacity: 0 }
                    }
                    animate={
                      isDraining
                        ? reducedMotion
                          ? { opacity: 0 }
                          : { y: 18, opacity: 0, scale: 0.5 }
                        : reducedMotion
                        ? { opacity: 1 }
                        : { y: 0, scale: 1, opacity: 1 }
                    }
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 24,
                      delay: cascadeDelay,
                    }}
                    className="relative z-10 select-none font-mono"
                  >
                    {digit}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Bottom Dot Accent for Filled Slot */}
              {isFilled && activeStatus === 'idle' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent-brand shadow-[0_0_4px_#3B82F6]"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const OtpCodeSlots = CodeSlots;
export type OtpCodeSlotsProps = CodeSlotsProps;
