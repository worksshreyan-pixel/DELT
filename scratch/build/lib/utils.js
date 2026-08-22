import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return twMerge(clsx(inputs));
}
export function serializeDescription(description, previewEnabled) {
    var cleanDesc = stripMetadata(description || '');
    if (!previewEnabled)
        return cleanDesc || null;
    return "".concat(cleanDesc, "\n\n[DELT_SETTINGS:preview_enabled=true]").trim();
}
export function parseDescription(description) {
    var descText = description || '';
    var previewEnabled = descText.includes('[DELT_SETTINGS:preview_enabled=true]');
    var cleanDesc = stripMetadata(descText);
    return { description: cleanDesc, previewEnabled: previewEnabled };
}
function stripMetadata(text) {
    return text.replace(/\n*\[DELT_SETTINGS:[^\]]+\]/g, '').trim();
}
