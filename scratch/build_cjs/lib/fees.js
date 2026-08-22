"use strict";
// ==============================================================================
// DELT — Centralized Platform Fee Engine
// ==============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDealFees = exports.PLATFORM_FEE_CONFIG = void 0;
exports.PLATFORM_FEE_CONFIG = {
    defaultPlatformRate: 0.05,
    defaultProcessingRate: 0.02, // 2% Payment gateway processing
};
/**
 * Calculates gross, fees, and creator net amounts.
 */
function calculateDealFees(amount, currency = 'INR', customPlatformRate = exports.PLATFORM_FEE_CONFIG.defaultPlatformRate) {
    const platformFee = Math.round(amount * customPlatformRate);
    const processingFee = Math.round(amount * exports.PLATFORM_FEE_CONFIG.defaultProcessingRate);
    const creatorNet = Math.max(0, amount - platformFee - processingFee);
    return {
        grossAmount: amount,
        platformFeeRate: customPlatformRate,
        platformFee,
        processingFeeRate: exports.PLATFORM_FEE_CONFIG.defaultProcessingRate,
        processingFee,
        creatorNet,
        currency,
    };
}
exports.calculateDealFees = calculateDealFees;
