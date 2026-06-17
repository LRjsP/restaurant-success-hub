import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard/KpiTile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, Trash2, Search, UserPlus, X } from "lucide-react";
import { fmtCurrency2 } from "@/lib/format";
import {
  getServiceCatalog, submitOrder, searchGuests, createGuest, recentOrders, voidOrder,
} from "@/lib/service.functions";
import type { OrderLine } from "@/lib/service-schema";
import { computeOrderTotals } from "@/lib/service-schema";

type Guest = { id: string; name: string; email: string | null; tier: string; visit_count: number; lifetime_value: number };

export function ServicePage() {
  const qc = useQueryClient();
  const fetchCatalog = useServerFn(getServiceCatalog);
  const fetchRecent = useServerFn(recentOrders);
  const submit = useServerFn(submitOrder);
  const voidFn = useServerFn(voidOrder);

  const catalog = useQuery({ queryKey: ["service-catalog"], queryFn: () => fetchCatalog() });
  const recent = useQuery({ queryKey: ["service-recent"], queryFn: () => fetchRecent(), refetchInterval: 15_000 });

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [hour, setHour] = useState(now.getHours());
  const [center, setCenter] = useState("dining_room");
  const [partySize, setPartySize] = useState(2);
  const [tableNo, setTableNo] = useState("");
  const [serverName, setServerName] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [guest, setGuest] = useState<Guest | null>(null);

  const items = catalog.data?.items ?? [];
  const centers = catalog.data?.revenue_centers ?? [];
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  if (!activeCategory && categories.length) setActiveCategory(categories[0]);

  const filteredItems = items.filter((i) =>
    (activeCategory ? i.category === activeCategory : true) &&
    (search ? i.name.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit_price, 0);
  const discountAmount = discountMode === "percent" ? (subtotal * discount) / 100 : discount;
  const totals = computeOrderTotals(lines, discountAmount);

  const channel = useMemo(() => {
    if (center === "takeout") return "Takeout";
    if (center === "delivery") return "Delivery";
    if (center === "catering") return "Catering";
    return "Dine-in";
  }, [center]);

  function addItem(it: { id: string; name: string; category: string; price: number; plate_cost: number }) {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.menu_item_id === it.id);
      if (i >= 0) {
        const next = [...prev]; next[i] = { ...next[i], qty: next[i].qty + 1 }; return next;
      }
      return [...prev, { menu_item_id: it.id, name: it.name, category: it.category, qty: 1, unit_price: it.price, plate_cost: it.plate_cost, comp: false }];
    });
  }
  function updateLine(idx: number, patch: Partial<OrderLine>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  const submitMut = useMutation({
    mutationFn: async () => submit({
      data: {
        date, hour, revenue_center: center, party_size: partySize,
        table_no: tableNo, server_name: serverName,
        guest_id: guest?.id ?? null,
        discount: discountAmount,
        lines,
      },
    }),
    onSuccess: () => {
      toast.success("Order submitted");
      setLines([]); setDiscount(0); setTableNo(""); setGuest(null);
      qc.invalidateQueries({ queryKey: ["service-recent"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to submit"),
  });

  const voidMut = useMutation({
    mutationFn: async (order_id: string) => voidFn({ data: { order_id } }),
    onSuccess: () => { toast.success("Order voided"); qc.invalidateQueries({ queryKey: ["service-recent"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to void"),
  });

  const canSubmit = lines.length > 0 && partySize >= 1 && !!center && !submitMut.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-mono text-xs uppercase tracking-widest text-accent">Order Entry</h1>
          <p className="text-2xl font-semibold tracking-tight">The Service</p>
          <p className="text-sm text-muted-foreground">Cashier & waiter terminal. Tickets here feed the Floor, Office and Architect dashboards in real time.</p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] uppercase">{channel}</Badge>
      </div>

      {/* Context bar */}
      <Panel title="Service Context" subtitle="Where and when this ticket belongs">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <Field label="Date"><Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Hour">
            <Select value={String(hour)} onValueChange={(v) => setHour(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: 24 }).map((_, h) => <SelectItem key={h} value={String(h)}>{String(h).padStart(2, "0")}:00</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Revenue Center">
            <Select value={center} onValueChange={setCenter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{centers.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Party Size"><Input type="number" min={1} value={partySize} onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))} /></Field>
          <Field label="Table #"><Input value={tableNo} onChange={(e) => setTableNo(e.target.value)} placeholder="optional" /></Field>
          <Field label="Server"><Input value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="optional" /></Field>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Items */}
        <Panel title="Menu" subtitle="Tap an item to add to the ticket" className="lg:col-span-3">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            {categories.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className={`rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors ${activeCategory === c ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {c}
              </button>
            ))}
          </div>
          {catalog.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading menu…</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-sm text-muted-foreground">No items match.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filteredItems.map((it) => (
                <button key={it.id} onClick={() => addItem(it)}
                  className="flex flex-col items-start rounded-sm border border-border bg-card p-3 text-left transition-colors hover:border-accent hover:bg-accent/5">
                  <span className="line-clamp-2 text-sm font-medium">{it.name}</span>
                  <span className="mt-1 font-mono text-xs text-muted-foreground">{fmtCurrency2(it.price)}</span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        {/* Cart */}
        <Panel title="Ticket" subtitle={`${lines.length} item${lines.length === 1 ? "" : "s"}`} className="lg:col-span-2">
          <div className="space-y-3">
            <GuestPicker guest={guest} onChange={setGuest} />

            <div className="space-y-1.5 max-h-[40vh] overflow-auto pr-1">
              {lines.length === 0 && <div className="rounded-sm border border-dashed border-border p-4 text-center text-xs text-muted-foreground">No items yet — tap from the menu.</div>}
              {lines.map((l, i) => (
                <div key={i} className="rounded-sm border border-border bg-card p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{l.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{l.category}</div>
                    </div>
                    <button onClick={() => removeLine(i)} aria-label={`Remove ${l.name} from ticket`} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" aria-hidden /></button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" aria-label={`Decrease quantity of ${l.name}`} className="h-7 w-7" onClick={() => updateLine(i, { qty: Math.max(1, l.qty - 1) })}><Minus className="h-3 w-3" aria-hidden /></Button>
                      <span className="w-6 text-center font-mono text-sm">{l.qty}</span>
                      <Button size="icon" variant="outline" aria-label={`Increase quantity of ${l.name}`} className="h-7 w-7" onClick={() => updateLine(i, { qty: l.qty + 1 })}><Plus className="h-3 w-3" aria-hidden /></Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <input type="checkbox" checked={l.comp} onChange={(e) => updateLine(i, { comp: e.target.checked })} />
                        Comp
                      </label>
                      <span className={`font-mono text-sm ${l.comp ? "text-muted-foreground line-through" : ""}`}>{fmtCurrency2(l.qty * l.unit_price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{fmtCurrency2(totals.gross_sales)}</span></div>
              {totals.comps > 0 && <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Comps</span><span className="font-mono">−{fmtCurrency2(totals.comps)}</span></div>}
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Discount</span>
                <div className="flex items-center gap-1">
                  <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} className="h-7 w-20 text-right font-mono" />
                  <Select value={discountMode} onValueChange={(v) => setDiscountMode(v as any)}>
                    <SelectTrigger className="h-7 w-16"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="amount">$</SelectItem><SelectItem value="percent">%</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Est. food cost</span><span className="font-mono text-muted-foreground">{fmtCurrency2(totals.food_cost + totals.beverage_cost)}</span></div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-base"><span className="font-semibold">Net total</span><span className="font-mono font-semibold">{fmtCurrency2(totals.net_sales)}</span></div>
            </div>

            <Button className="w-full" disabled={!canSubmit} onClick={() => submitMut.mutate()}>
              {submitMut.isPending ? "Submitting…" : "Submit Order"}
            </Button>
          </div>
        </Panel>
      </div>

      <Panel title="Today's Tickets" subtitle="Last orders submitted today">
        {recent.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (recent.data?.length ?? 0) === 0 ? (
          <div className="text-sm text-muted-foreground">No orders yet today.</div>
        ) : (
          <div className="divide-y divide-border">
            {recent.data!.map((o) => (
              <div key={o.order_id} className={`flex items-center justify-between py-2 text-sm ${o.voided ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="font-medium">{o.revenue_center}</span>
                  <span className="text-muted-foreground">party {o.party_size}{o.table_no ? ` · T${o.table_no}` : ""}</span>
                  <span className="text-muted-foreground">{o.line_count} item{o.line_count === 1 ? "" : "s"}</span>
                  {o.voided && <Badge variant="outline" className="text-[10px]">VOIDED</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{fmtCurrency2(o.net_sales)}</span>
                  {!o.voided && (
                    <Button size="sm" variant="ghost" onClick={() => voidMut.mutate(o.order_id)} disabled={voidMut.isPending}>Void</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function GuestPicker({ guest, onChange }: { guest: Guest | null; onChange: (g: Guest | null) => void }) {
  const search = useServerFn(searchGuests);
  const create = useServerFn(createGuest);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Guest[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  async function runSearch(value: string) {
    setQ(value); setOpen(true);
    if (value.trim().length < 2) { setResults([]); return; }
    try {
      const r = await search({ data: { q: value } });
      setResults(r as Guest[]);
    } catch { /* ignore */ }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const g = await create({ data: { name: newName.trim(), email: newEmail.trim() } });
      onChange(g as Guest);
      setCreating(false); setNewName(""); setNewEmail(""); setOpen(false); setQ("");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  }

  if (guest) {
    return (
      <div className="flex items-center justify-between rounded-sm border border-border bg-card p-2 text-sm">
        <div>
          <div className="font-medium">{guest.name}</div>
          <div className="font-mono text-[10px] uppercase text-muted-foreground">{guest.tier} · {guest.visit_count} visits</div>
        </div>
        <button onClick={() => onChange(null)} aria-label="Clear selected guest" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" aria-hidden /></button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Guest (optional)</Label>
      <div className="relative">
        <Input placeholder="Search guest by name or email" value={q} onChange={(e) => runSearch(e.target.value)} onFocus={() => setOpen(true)} />
        {open && (q || results.length > 0) && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-sm border border-border bg-popover shadow-md">
            {results.map((g) => (
              <button key={g.id} onClick={() => { onChange(g); setOpen(false); setQ(""); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent/10">
                <div className="font-medium">{g.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{g.email ?? "no email"} · {g.tier}</div>
              </button>
            ))}
            {!creating && (
              <button onClick={() => { setCreating(true); setNewName(q); }} className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm hover:bg-accent/10">
                <UserPlus className="h-3.5 w-3.5" /> Create new guest{q ? ` "${q}"` : ""}
              </button>
            )}
            {creating && (
              <div className="space-y-2 border-t border-border p-2">
                <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input placeholder="Email (optional)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleCreate}>Create</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
