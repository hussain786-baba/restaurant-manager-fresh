import { useState } from "react";
import {
  useGetEarningsBreakdown,
  useGetDashboardRevenue,
  useGetTopItems,
} from "@workspace/api-client-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { money } from "@/lib/format";

export default function AdminEarningsPage() {
  const breakdown = useGetEarningsBreakdown();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const revenue = useGetDashboardRevenue({ period });
  const top = useGetTopItems();
  const b = breakdown.data;

  function trend(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="gold-stamp">The ledger</span>
        <h1 className="font-display text-4xl mt-2">Earnings</h1>
        <p className="text-ink-3 text-sm mt-1">
          What's coming in, and how it compares.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          label="Today"
          value={b ? money(b.today) : "—"}
          delta={b ? trend(b.today, b.yesterday) : 0}
          deltaLabel="vs yesterday"
        />
        <Card
          label="This week"
          value={b ? money(b.thisWeek) : "—"}
          delta={b ? trend(b.thisWeek, b.lastWeek) : 0}
          deltaLabel="vs last week"
        />
        <Card
          label="This month"
          value={b ? money(b.thisMonth) : "—"}
          delta={b ? trend(b.thisMonth, b.lastMonth) : 0}
          deltaLabel="vs last month"
          big
        />
      </div>

      <div className="paper-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
              Trend
            </div>
            <div className="font-display text-2xl">Revenue over time</div>
          </div>
          <div className="inline-flex bg-paper-2 rounded-full p-1">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-full text-xs capitalize ${
                  period === p
                    ? "bg-ink text-paper"
                    : "text-ink-3 hover:text-ink"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[320px] mt-5 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue.data ?? []}>
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
                cursor={{ fill: "rgba(200,146,42,0.08)" }}
                contentStyle={{
                  background: "#0D0B0A",
                  border: "none",
                  borderRadius: 8,
                  color: "#FEFCF8",
                  fontSize: 12,
                }}
                formatter={(v: number) => [money(v), "Revenue"]}
              />
              <Bar
                dataKey="revenue"
                fill="#C8922A"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="paper-card p-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
          Top revenue dishes · 30 days
        </div>
        <h2 className="font-display text-2xl mt-1">What's selling</h2>
        <div className="overflow-x-auto mt-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-ink-3 border-b border-line">
                <th className="py-2 pr-4">Dish</th>
                <th className="py-2 pr-4">Sold</th>
                <th className="py-2 pr-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {top.data?.map((it) => (
                <tr key={it.menuItemId} className="border-b border-line/60">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{it.imageEmoji ?? "🍽"}</span>
                      <span className="font-medium">{it.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono">{it.totalSold}</td>
                  <td className="py-3 pr-4 font-mono text-right">
                    {money(it.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  delta,
  deltaLabel,
  big,
}: {
  label: string;
  value: string;
  delta: number;
  deltaLabel: string;
  big?: boolean;
}) {
  const positive = delta >= 0;
  return (
    <div
      className={`paper-card p-5 ${big ? "lg:col-span-1" : ""}`}
      style={big ? { background: "linear-gradient(135deg, #FFFFFF 0%, #FAF6EE 100%)" } : undefined}
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
        {label}
      </div>
      <div
        className={`font-display numeric mt-2 ${big ? "text-5xl" : "text-3xl"}`}
      >
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
            positive
              ? "bg-sage/10 text-sage"
              : "bg-crimson/10 text-crimson"
          }`}
        >
          {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(delta)}%
        </span>
        <span className="text-ink-4">{deltaLabel}</span>
      </div>
    </div>
  );
}
