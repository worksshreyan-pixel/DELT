import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/plans';

interface UsageMeterProps {
  used: number;
  total: number;
  label: string;
  unit?: 'bytes' | 'count';
  warningThreshold?: number;
}

export function UsageMeter({
  used,
  total,
  label,
  unit = 'bytes',
  warningThreshold = 0.8,
}: UsageMeterProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const isWarning = percentage >= warningThreshold * 100;
  const isCritical = percentage >= 100;

  const formatValue = (val: number) =>
    unit === 'bytes' ? formatBytes(val) : val.toLocaleString('en-IN');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {formatValue(used)} / {formatValue(total)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isCritical
              ? 'bg-destructive'
              : isWarning
                ? 'bg-warning'
                : 'bg-primary'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isWarning && !isCritical && (
        <p className="text-xs text-warning">Approaching limit</p>
      )}
      {isCritical && (
        <p className="text-xs text-destructive">Storage full — upgrade to upload more</p>
      )}
    </div>
  );
}
