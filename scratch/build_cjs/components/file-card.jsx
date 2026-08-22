"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCard = void 0;
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const plans_1 = require("@/lib/plans");
function getFileIcon(type) {
    switch (type) {
        case 'image':
            return lucide_react_1.FileImage;
        case 'video':
            return lucide_react_1.FileVideo;
        case 'design':
            return lucide_react_1.FileArchive;
        case 'code':
            return lucide_react_1.FileCode;
        default:
            return lucide_react_1.File;
    }
}
function FileCard({ file, locked }) {
    const Icon = getFileIcon(file.type);
    return (<framer_motion_1.motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={(0, utils_1.cn)('group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors', locked ? 'opacity-60' : 'hover:bg-accent/50')}>
      <div className={(0, utils_1.cn)('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', locked ? 'bg-muted' : 'bg-primary/5')}>
        {locked ? <lucide_react_1.Lock className="h-4 w-4 text-muted-foreground"/> : <Icon className="h-4 w-4 text-primary"/>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground">{(0, plans_1.formatBytes)(file.size)}</p>
          {file.previewStatus === 'ready' && (<span className="text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              Preview ready
            </span>)}
          {file.previewStatus === 'failed' && (<span className="text-[10px] text-red-500 font-medium bg-red-500/10 px-1.5 py-0.5 rounded-md">
              Preview unavailable
            </span>)}
        </div>
      </div>
      {!locked && (<button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
          <lucide_react_1.Download className="h-4 w-4"/>
        </button>)}
    </framer_motion_1.motion.div>);
}
exports.FileCard = FileCard;
