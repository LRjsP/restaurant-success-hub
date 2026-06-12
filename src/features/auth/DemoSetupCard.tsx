import { Button } from "@/components/ui/button";

type DemoStatus = {
  canSetupDemo: boolean;
  password: string;
  accounts: { email: string; role: string }[];
};

export function DemoSetupCard({
  status,
  loading,
  onSetup,
}: {
  status: DemoStatus;
  loading: boolean;
  onSetup: () => void;
}) {
  return (
    <div className="mb-5 rounded-sm border border-border bg-card p-4 text-sm">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">First-time setup</div>
      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
        {status.accounts.map((account) => (
          <div key={account.email} className="flex items-center justify-between gap-3">
            <span className="font-medium text-foreground">{account.email}</span>
            <span className="font-mono uppercase tracking-wider">{account.role}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <span>Password</span>
          <span className="font-mono text-foreground">{status.password}</span>
        </div>
      </div>
      <Button type="button" className="mt-4 w-full" onClick={onSetup} disabled={loading}>
        {loading ? "Creating accounts…" : "Create demo accounts"}
      </Button>
    </div>
  );
}
