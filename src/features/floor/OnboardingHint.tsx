import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";

const HINT_KEY = "mise_floor_hint_dismissed";

export function OnboardingHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(HINT_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(HINT_KEY, "1");
  };

  return (
    <div className="relative overflow-hidden rounded-md border border-accent/30 bg-accent/10 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <ArrowRight className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Need deeper analytics?</p>
            <p className="text-xs text-muted-foreground">
              Open{" "}
              <Link
                to="/office"
                search={(prev: any) => prev}
                className="inline-flex items-center gap-0.5 font-medium text-accent underline underline-offset-2 hover:text-accent/80"
              >
                The Office <ArrowRight className="h-3 w-3" />
              </Link>{" "}
              for P&L, labor, and cost breakdowns.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss hint"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
