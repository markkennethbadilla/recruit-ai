"use client";

import { cn } from "@/lib/utils";

/** Animated shimmer pulse skeleton for loading states */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-[var(--glass)]", className)}
      {...props}
    />
  );
}

/** Card-shaped skeleton placeholder */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-6 space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/** Grid of skeleton cards for loading dashboards */
export function SkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div className={cn(`grid gap-4`, cols === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
