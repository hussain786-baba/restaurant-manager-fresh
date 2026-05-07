import { useState } from "react";
import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useGetDashboardRevenue,
  useGetTablesOverview,
  useGetDashboardAlerts,
  useDismissAlert,
  useGetTopItems,
  useSimulateOrder,
  getGetDashboardSummaryQueryKey,
  getGetDashboardRevenueQueryKey,
  getGetTablesOverviewQueryKey,
  getGetDashboardAlertsQueryKey,
  getListAdminOrdersQueryKey,
  getGetTopItemsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  TrendingUp,
  ScrollText,
  Sparkles,
  X,
  Bell,
  Activity,
  Users,
  IndianRupee,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { money, timeAgo } from "@/lib/format";
import { StatusPill } from "@/components/Brand";

const PERIODS = [
  { id: "daily" as const, label: "Daily" },
  { id: "weekly" as const, label: "Weekly" },
  { id: "monthly" as const, label: "Monthly" },
];

export default function AdminDashboard() {
  const summary = useGetDashboardSummary({
    query: {
      queryKey: getGetDashboardSummaryQueryKey(),
      refetchInterval: 15000,
    },
  });
  const tables = useGetTablesOverview({
    query: {
      queryKey: getGetTablesOverviewQueryKey(),
      refetchInterval: 10000,
    },
  });
  const alerts = useGetDashboardAlerts({
    query: {
      queryKey: getGetDashboardAlertsQueryKey(),
      refetchInterval: 8000,
    },
  });
  const topItems = useGetTopItems();
  const dismiss = useDismissAlert();
  const simulate = useSimulateOrder();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const revenue = useGetDashboardRevenue({ period });

  async function runSimulate() {
    try {
      await simulate.mutateAsync();
      toast.success("Demo order created.");
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardRevenueQueryKey() });
      qc.invalidateQueries({ queryKey: getGetTablesOverviewQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardAlertsQueryKey() });
      qc.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
      qc.invalidateQueries({ queryKey: getGetTopItemsQueryKey() });
    } catch {
      toast.error("Could not create demo order.");
    }
  }

  async function handleDismiss(id: number) {
    await dismiss.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getGetDashboardAlertsQueryKey() });
  }

  const s = summary.data;
  const stats = [
    {
      label: "Revenue today",
      value: s ? money(s.revenueToday) : "—",
      icon: IndianRupee,
      tone: "gold",
    },
    {
      label: "Orders today",
      value: s ? s.ordersToday.toString() : "—",
      icon: ScrollText,
      tone: "ink",
    },
    {
      label: "Active tables",
      value: s ? `${s.activeTables}/${s.totalTables}` : "—",
      icon: Users,
      tone: "ink",
    },
    {
      label: "Pending orders",
      value: s ? s.pendingOrders.toString() : "—",
      icon: Activity,
      tone: "ink",
    },
    {
      label: "Avg order value",
      value: s ? money(s.avgOrderValue) : "—",
      icon: TrendingUp,
      tone: "ink",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="gold-stamp">Tonight's service</span>
          <h1 className="font-display text-4xl mt-2">Pass</h1>
          <p className="text-ink-3 text-sm mt-1">
            A live look at your dining room.
          </p>
        </div>
        <button
          type="button"
          onClick={runSimulate}
          disabled={simulate.isPending}
          className="btn-ink rounded-full px-5 py-2.5 text-sm inline-flex items-center gap-2"
        >
          <Sparkles size={14} /> Simulate new order
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {stats.map((st) => {
          const Icon = st.icon;
          return (
            <div key={st.label} className="paper-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.16em] text-ink-3">
                  {st.label}
                </span>
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                    st.tone === "gold"
                      ? "bg-gold/15 text-gold-3"
                      : "bg-paper-2 text-ink-3"
                  }`}
                >
                  <Icon size={13} />
                </span>
              </div>
              <div className="font-display text-3xl mt-2 numeric">
                {st.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="paper-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
                Revenue
              </div>
              <div className="font-display text-2xl mt-1">
                {period === "daily"
                  ? "Last 7 days"
                  : period === "weekly"
                  ? "Last 8 weeks"
                  : "Last 6 months"}
              </div>
            </div>
            <div className="inline-flex bg-paper-2 rounded-full p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1 rounded-full text-xs ${
                    period === p.id
                      ? "bg-ink text-paper"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[280px] mt-5 -mx-2">
            {revenue.data && revenue.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue.data}>
                  <defs>
                    <linearGradient
                      id="goldGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#C8922A" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#C8922A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E2DDD5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#8A8077"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#8A8077"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0D0B0A",
                      border: "none",
                      borderRadius: 8,
                      color: "#FEFCF8",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [money(v), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#C8922A"
                    strokeWidth={2}
                    fill="url(#goldGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="skeleton w-full h-full" />
            )}
          </div>
        </div>

        <div className="paper-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3 inline-flex items-center gap-2">
              <Bell size={13} /> Live alerts
            </div>
            <span className="text-[11px] text-ink-4">
              {(alerts.data?.length ?? 0)} open
            </span>
          </div>
          <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {alerts.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-14" />
              ))
            ) : (alerts.data?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-ink-4 text-sm italic">
                All quiet on the floor.
              </div>
            ) : (
              alerts.data?.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 bg-paper-2 rounded-xl p-3"
                >
                  <span
                    className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                      a.type === "waiter_call"
                        ? "bg-crimson"
                        : a.type === "new_order"
                        ? "bg-gold"
                        : "bg-sage"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-ink-3 mt-0.5">
                      {a.message}
                    </div>
                    <div className="text-[10px] text-ink-4 mt-1">
                      {timeAgo(a.createdAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismiss(a.id)}
                    className="text-ink-4 hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Floor map
            </div>
            <h2 className="font-display text-2xl">Tables overview</h2>
          </div>
          <Link
            href="/admin/tables"
            className="text-xs text-gold-3 hover:underline"
          >
            Manage tables →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {tables.data?.map((t) => (
            <Link
              key={t.id}
              href={
                t.activeOrderId
                  ? `/admin/orders/${t.activeOrderId}`
                  : "/admin/tables"
              }
              className="paper-card p-3 hover:border-gold transition-colors block"
            >
              <div className="flex items-baseline justify-between">
                <div className="font-display text-lg">{t.label}</div>
                <span className="font-mono text-[10px] uppercase text-ink-4">
                  {t.code}
                </span>
              </div>
              <StatusPill status={t.status} className="mt-2" />
              <div className="mt-3 text-[11px] text-ink-3">
                Seats {t.capacity}
                {t.guestCount ? ` · ${t.guestCount} guests` : ""}
              </div>
              {typeof t.activeOrderTotal === "number" ? (
                <div className="mt-1 font-mono text-sm numeric font-semibold">
                  {money(t.activeOrderTotal)}
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-ink-4 italic">
                  No active order
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="paper-card p-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
            Top sellers · 30 days
          </div>
          <h2 className="font-display text-2xl mt-1">Loved by your guests</h2>
          <ul className="mt-4 divide-y divide-line">
            {topItems.data?.slice(0, 6).map((it, idx) => (
              <li
                key={it.menuItemId}
                className="py-3 flex items-center gap-3"
              >
                <span className="font-display text-2xl text-ink-4 w-6">
                  {idx + 1}
                </span>
                <div className="menu-tile w-10 h-10 text-lg">
                  {it.imageEmoji ?? "🍽"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{it.name}</div>
                  <div className="text-xs text-ink-3">
                    {it.totalSold} sold
                  </div>
                </div>
                <div className="font-mono text-sm">{money(it.revenue)}</div>
              </li>
            ))}
            {(!topItems.data || topItems.data.length === 0) && (
              <li className="text-sm text-ink-4 italic py-3">
                No data yet.
              </li>
            )}
          </ul>
        </div>

        <div className="paper-card p-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
            Period at a glance
          </div>
          <h2 className="font-display text-2xl mt-1">Earnings</h2>
          <div className="grid grid-cols-2 gap-4 mt-5">
            <Stat
              label="Today"
              value={s ? money(s.revenueToday) : "—"}
            />
            <Stat
              label="This week"
              value={s ? money(s.weekRevenue) : "—"}
            />
            <Stat
              label="This month"
              value={s ? money(s.monthRevenue) : "—"}
              big
            />
            <Stat
              label="Avg ticket"
              value={s ? money(s.avgOrderValue) : "—"}
            />
          </div>
          <Link
            href="/admin/earnings"
            className="block mt-6 text-xs text-gold-3 hover:underline"
          >
            See full earnings breakdown →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className={big ? "col-span-2" : ""}>
      <div className="text-[11px] uppercase tracking-[0.16em] text-ink-3">
        {label}
      </div>
      <div
        className={`font-display numeric ${
          big ? "text-4xl" : "text-2xl"
        } mt-1`}
      >
        {value}
      </div>
    </div>
  );
}
