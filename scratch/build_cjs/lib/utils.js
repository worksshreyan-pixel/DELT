"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDescription = exports.serializeDescription = exports.cn = void 0;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
exports.cn = cn;
function serializeDescription(description, previewEnabled) {
    const cleanDesc = stripMetadata(description || '');
    if (!previewEnabled)
        return cleanDesc || null;
    return `${cleanDesc}\n\n[DELT_SETTINGS:preview_enabled=true]`.trim();
}
exports.serializeDescription = serializeDescription;
function parseDescription(description) {
    const descText = description || '';
    const previewEnabled = descText.includes('[DELT_SETTINGS:preview_enabled=true]');
    const cleanDesc = stripMetadata(descText);
    return { description: cleanDesc, previewEnabled };
}
exports.parseDescription = parseDescription;
function stripMetadata(text) {
    return text.replace(/\n*\[DELT_SETTINGS:[^\]]+\]/g, '').trim();
}
