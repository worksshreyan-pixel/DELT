"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timeline = exports.TimelineEvent = void 0;
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const eventConfig = {
    deal_created: { icon: lucide_react_1.FilePlus, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
    deal_shared: { icon: lucide_react_1.Send, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950' },
    deal_viewed: { icon: lucide_react_1.Eye, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
    client_verified: { icon: lucide_react_1.Mail, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950' },
    message_sent: { icon: lucide_react_1.FileText, color: 'text-muted-foreground bg-muted' },
    price_proposed: { icon: lucide_react_1.ArrowLeftRight, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
    counter_offered: { icon: lucide_react_1.ArrowLeftRight, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
    price_accepted: { icon: lucide_react_1.CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    price_declined: { icon: lucide_react_1.XCircle, color: 'text-red-500 bg-red-50 dark:bg-red-950' },
    file_uploaded: { icon: lucide_react_1.Upload, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950' },
    file_version_created: { icon: lucide_react_1.FilePlus, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950' },
    deliverable_approved: { icon: lucide_react_1.CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    change_requested: { icon: lucide_react_1.Flag, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
    change_responded: { icon: lucide_react_1.CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    payment_initiated: { icon: lucide_react_1.DollarSign, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
    payment_completed: { icon: lucide_react_1.DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    payment_failed: { icon: lucide_react_1.XCircle, color: 'text-red-500 bg-red-50 dark:bg-red-950' },
    files_unlocked: { icon: lucide_react_1.Unlock, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    milestone_completed: { icon: lucide_react_1.Flag, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    project_completed: { icon: lucide_react_1.CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
};
function formatEventDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60)
        return 'just now';
    if (diff < 3600)
        return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)
        return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800)
        return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function TimelineEvent({ event, isLast }) {
    const config = eventConfig[event.type] || eventConfig.message_sent;
    const Icon = config.icon;
    return (<framer_motion_1.motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={(0, utils_1.cn)('flex h-8 w-8 items-center justify-center rounded-full shrink-0', config.color)}>
          <Icon className="h-4 w-4"/>
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1"/>}
      </div>
      <div className="flex-1 pb-6">
        <p className="text-sm font-medium">{event.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {event.actorName && (<span className="text-xs text-muted-foreground">{event.actorName}</span>)}
          <span className="text-xs text-muted-foreground/60">·</span>
          <span className="text-xs text-muted-foreground">{formatEventDate(event.createdAt)}</span>
        </div>
      </div>
    </framer_motion_1.motion.div>);
}
exports.TimelineEvent = TimelineEvent;
function Timeline({ events }) {
    return (<div className="space-y-0">
      {events.map((event, i) => (<TimelineEvent key={event.id} event={event} isLast={i === events.length - 1}/>))}
    </div>);
}
exports.Timeline = Timeline;
