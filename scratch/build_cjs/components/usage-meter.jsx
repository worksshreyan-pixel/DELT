"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageMeter = void 0;
const utils_1 = require("@/lib/utils");
const plans_1 = require("@/lib/plans");
function UsageMeter({ used, total, label, unit = 'bytes', warningThreshold = 0.8, }) {
    const percentage = total > 0 ? (used / total) * 100 : 0;
    const isWarning = percentage >= warningThreshold * 100;
    const isCritical = percentage >= 100;
    const formatValue = (val) => unit === 'bytes' ? (0, plans_1.formatBytes)(val) : val.toLocaleString('en-IN');
    return (<div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {formatValue(used)} / {formatValue(total)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={(0, utils_1.cn)('h-full rounded-full transition-all duration-500', isCritical
            ? 'bg-destructive'
            : isWarning
                ? 'bg-warning'
                : 'bg-primary')} style={{ width: `${Math.min(percentage, 100)}%` }}/>
      </div>
      {isWarning && !isCritical && (<p className="text-xs text-warning">Approaching limit</p>)}
      {isCritical && (<p className="text-xs text-destructive">Storage full — upgrade to upload more</p>)}
    </div>);
}
exports.UsageMeter = UsageMeter;
