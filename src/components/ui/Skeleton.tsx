import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  const radiusMap = { sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl", full: "rounded-full" };
  return (
    <div
      className={cn(
        "animate-pulse bg-white/8",
        radiusMap[rounded],
        className
      )}
      style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }}
    />
  );
}
