import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/plans';
export function UsageMeter(_a) {
    var used = _a.used, total = _a.total, label = _a.label, _b = _a.unit, unit = _b === void 0 ? 'bytes' : _b, _c = _a.warningThreshold, warningThreshold = _c === void 0 ? 0.8 : _c;
    var percentage = total > 0 ? (used / total) * 100 : 0;
    var isWarning = percentage >= warningThreshold * 100;
    var isCritical = percentage >= 100;
    var formatValue = function (val) {
        return unit === 'bytes' ? formatBytes(val) : val.toLocaleString('en-IN');
    };
    return (<div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {formatValue(used)} / {formatValue(total)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all duration-500', isCritical
            ? 'bg-destructive'
            : isWarning
                ? 'bg-warning'
                : 'bg-primary')} style={{ width: "".concat(Math.min(percentage, 100), "%") }}/>
      </div>
      {isWarning && !isCritical && (<p className="text-xs text-warning">Approaching limit</p>)}
      {isCritical && (<p className="text-xs text-destructive">Storage full — upgrade to upload more</p>)}
    </div>);
}
