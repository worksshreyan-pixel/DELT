// ==============================================================================
// DELT — Centralized Platform Fee Engine
// ==============================================================================
export var PLATFORM_FEE_CONFIG = {
    defaultPlatformRate: 0.05,
    defaultProcessingRate: 0.02, // 2% Payment gateway processing
};
/**
 * Calculates gross, fees, and creator net amounts.
 */
export function calculateDealFees(amount, currency, customPlatformRate) {
    if (currency === void 0) { currency = 'INR'; }
    if (customPlatformRate === void 0) { customPlatformRate = PLATFORM_FEE_CONFIG.defaultPlatformRate; }
    var platformFee = Math.round(amount * customPlatformRate);
    var processingFee = Math.round(amount * PLATFORM_FEE_CONFIG.defaultProcessingRate);
    var creatorNet = Math.max(0, amount - platformFee - processingFee);
    return {
        grossAmount: amount,
        platformFeeRate: customPlatformRate,
        platformFee: platformFee,
        processingFeeRate: PLATFORM_FEE_CONFIG.defaultProcessingRate,
        processingFee: processingFee,
        creatorNet: creatorNet,
        currency: currency,
    };
}
