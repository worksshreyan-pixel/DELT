'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
export function EmptyState(_a) {
    var Icon = _a.icon, title = _a.title, description = _a.description, actionLabel = _a.actionLabel, actionHref = _a.actionHref, onAction = _a.onAction, className = _a.className;
    return (<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={cn('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground"/>
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionLabel && actionHref && (<Link href={actionHref} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          {actionLabel}
        </Link>)}
      {actionLabel && onAction && !actionHref && (<button onClick={onAction} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          {actionLabel}
        </button>)}
    </motion.div>);
}
