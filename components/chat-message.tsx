'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { DealMessage } from '@/lib/types';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface ChatMessageProps {
  message: DealMessage;
  isCurrentUser: boolean;
  showAvatar: boolean;
  children?: React.ReactNode;
}

export function ChatMessageItem({ message, isCurrentUser, showAvatar, children }: ChatMessageProps) {
  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1 w-1 rounded-full bg-muted-foreground" />
          {message.content}
          <span className="text-muted-foreground/60">·</span>
          <span className="text-muted-foreground/60">{formatTime(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn('flex gap-3', isCurrentUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div className="w-8 shrink-0">
        {showAvatar && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className={cn('text-xs font-medium', isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              {getInitials(message.senderName)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className={cn('flex flex-col gap-1 max-w-[75%]', isCurrentUser ? 'items-end' : 'items-start')}>
        {showAvatar && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-medium">{message.senderName}</span>
            <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
          </div>
        )}
        {children ? (
          children
        ) : (
          <div
            className={cn(
              'rounded-2xl px-3.5 py-2 text-sm',
              isCurrentUser
                ? 'bg-primary text-primary-foreground rounded-tr-md'
                : 'bg-muted text-foreground rounded-tl-md'
            )}
          >
            {message.content}
          </div>
        )}
      </div>
    </motion.div>
  );
}
