'use client';

import { motion } from 'framer-motion';
import { File, Lock, Download, FileArchive, FileImage, FileVideo, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/plans';
import type { FileVersionItem } from '@/lib/types';

function getFileIcon(type: string): React.ElementType {
  switch (type) {
    case 'image':
      return FileImage;
    case 'video':
      return FileVideo;
    case 'design':
      return FileArchive;
    case 'code':
      return FileCode;
    default:
      return File;
  }
}

interface FileCardProps {
  file: FileVersionItem;
  locked?: boolean;
}

export function FileCard({ file, locked }: FileCardProps) {
  const Icon = getFileIcon(file.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors',
        locked ? 'opacity-60' : 'hover:bg-accent/50'
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', locked ? 'bg-muted' : 'bg-primary/5')}>
        {locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Icon className="h-4 w-4 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          {file.previewStatus === 'ready' && (
            <span className="text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              Preview ready
            </span>
          )}
          {file.previewStatus === 'failed' && (
            <span className="text-[10px] text-red-500 font-medium bg-red-500/10 px-1.5 py-0.5 rounded-md">
              Preview unavailable
            </span>
          )}
        </div>
      </div>
      {!locked && (
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
          <Download className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}
