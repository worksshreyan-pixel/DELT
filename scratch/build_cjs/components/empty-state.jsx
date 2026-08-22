"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyState = void 0;
const link_1 = __importDefault(require("next/link"));
const framer_motion_1 = require("framer-motion");
const utils_1 = require("@/lib/utils");
function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction, className, }) {
    return (<framer_motion_1.motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={(0, utils_1.cn)('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground"/>
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel && actionHref && (<link_1.default href={actionHref} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          {actionLabel}
        </link_1.default>)}
      {actionLabel && onAction && !actionHref && (<button onClick={onAction} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          {actionLabel}
        </button>)}
    </framer_motion_1.motion.div>);
}
exports.EmptyState = EmptyState;
