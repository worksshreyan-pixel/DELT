"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logo = void 0;
const link_1 = __importDefault(require("next/link"));
const utils_1 = require("@/lib/utils");
function Logo({ className, href = '/', showText = true, size = 'md' }) {
    const sizes = {
        sm: { box: 'h-7 w-7', text: 'text-lg' },
        md: { box: 'h-8 w-8', text: 'text-xl' },
        lg: { box: 'h-10 w-10', text: 'text-2xl' },
    };
    const s = sizes[size];
    const content = (<div className="flex items-center gap-2">
      <div className={(0, utils_1.cn)('flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold', s.box)}>
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2">
          <path d="M6 4L6 20M6 4L14 4C17.5 4 20 6.5 20 10C20 13.5 17.5 16 14 16L6 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {showText && (<span className={(0, utils_1.cn)('font-display font-semibold tracking-tight', s.text)}>
          DELT
        </span>)}
    </div>);
    if (href) {
        return (<link_1.default href={href} className={(0, utils_1.cn)('inline-flex', className)}>
        {content}
      </link_1.default>);
    }
    return <div className={(0, utils_1.cn)('inline-flex', className)}>{content}</div>;
}
exports.Logo = Logo;
