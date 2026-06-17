import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  message,
  ctaLabel,
  onCta,
  className,
}: {
  icon: LucideIcon;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center gap-3 py-10 text-center " +
        (className ?? "")
      }
    >
      <Icon className="h-8 w-8 text-muted-foreground/40" />
      <p className="font-mono text-xs text-muted-foreground">{message}</p>
      {ctaLabel && onCta && (
        <Button type="button" size="sm" variant="outline" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
