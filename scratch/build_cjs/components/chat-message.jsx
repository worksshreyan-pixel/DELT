"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessageItem = void 0;
const framer_motion_1 = require("framer-motion");
const avatar_1 = require("@/components/ui/avatar");
const utils_1 = require("@/lib/utils");
function getInitials(name) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}
function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}
function ChatMessageItem({ message, isCurrentUser, showAvatar, children }) {
    if (message.type === 'system') {
        return (<div className="flex justify-center py-1">
        <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1 w-1 rounded-full bg-muted-foreground"/>
          {message.content}
          <span className="text-muted-foreground/60">·</span>
          <span className="text-muted-foreground/60">{formatTime(message.createdAt)}</span>
        </div>
      </div>);
    }
    return (<framer_motion_1.motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className={(0, utils_1.cn)('flex gap-3', isCurrentUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className="w-8 shrink-0">
        {showAvatar && (<avatar_1.Avatar className="h-8 w-8">
            <avatar_1.AvatarFallback className={(0, utils_1.cn)('text-xs font-medium', isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              {getInitials(message.senderName)}
            </avatar_1.AvatarFallback>
          </avatar_1.Avatar>)}
      </div>
      <div className={(0, utils_1.cn)('flex flex-col gap-1 max-w-[75%]', isCurrentUser ? 'items-end' : 'items-start')}>
        {showAvatar && (<div className="flex items-center gap-2 px-1">
            <span className="text-xs font-medium">{message.senderName}</span>
            <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
          </div>)}
        {children ? (children) : (<div className={(0, utils_1.cn)('rounded-2xl px-3.5 py-2 text-sm', isCurrentUser
                ? 'bg-primary text-primary-foreground rounded-tr-md'
                : 'bg-muted text-foreground rounded-tl-md')}>
            {message.content}
          </div>)}
      </div>
    </framer_motion_1.motion.div>);
}
exports.ChatMessageItem = ChatMessageItem;
