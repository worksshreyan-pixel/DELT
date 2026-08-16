import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function serializeDescription(description: string | null | undefined, previewEnabled: boolean): string | null {
  const cleanDesc = stripMetadata(description || '');
  if (!previewEnabled) return cleanDesc || null;
  return `${cleanDesc}\n\n[DELT_SETTINGS:preview_enabled=true]`.trim();
}

export function parseDescription(description: string | null | undefined): { description: string; previewEnabled: boolean } {
  const descText = description || '';
  const previewEnabled = descText.includes('[DELT_SETTINGS:preview_enabled=true]');
  const cleanDesc = stripMetadata(descText);
  return { description: cleanDesc, previewEnabled };
}

function stripMetadata(text: string): string {
  return text.replace(/\n*\[DELT_SETTINGS:[^\]]+\]/g, '').trim();
}
