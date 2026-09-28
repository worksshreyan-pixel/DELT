import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-12 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Active Workspaces skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/40 divide-y divide-border/30">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-2 w-1/3">
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
              <Skeleton className="h-4 w-44 rounded-md hidden lg:block" />
              <div className="space-y-1 w-24 text-right">
                <Skeleton className="h-4 w-20 ml-auto rounded-md" />
                <Skeleton className="h-3 w-14 ml-auto rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
