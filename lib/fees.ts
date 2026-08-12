// ==============================================================================
// DELT — Centralized Platform Fee Engine
// ==============================================================================

import type { Currency } from '@/lib/types';

export interface FeeBreakdown {
  grossAmount: number;
  platformFeeRate: number; // e.g. 0.05 (5%)
  platformFee: number;
  processingFeeRate: number; // e.g. 0.02 (2%)
  processingFee: number;
  creatorNet: number;
  currency: Currency;
}

export const PLATFORM_FEE_CONFIG = {
  defaultPlatformRate: 0.05, // 5% DELT platform fee
  defaultProcessingRate: 0.02, // 2% Payment gateway processing
};

/**
 * Calculates gross, fees, and creator net amounts.
 */
export function calculateDealFees(
  amount: number,
  currency: Currency = 'INR',
  customPlatformRate = PLATFORM_FEE_CONFIG.defaultPlatformRate
): FeeBreakdown {
  const platformFee = Math.round(amount * customPlatformRate);
  const processingFee = Math.round(amount * PLATFORM_FEE_CONFIG.defaultProcessingRate);
  const creatorNet = Math.max(0, amount - platformFee - processingFee);

  return {
    grossAmount: amount,
    platformFeeRate: customPlatformRate,
    platformFee,
    processingFeeRate: PLATFORM_FEE_CONFIG.defaultProcessingRate,
    processingFee,
    creatorNet,
    currency,
  };
}
