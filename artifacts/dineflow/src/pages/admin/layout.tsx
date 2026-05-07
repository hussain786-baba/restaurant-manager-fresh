import { type ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetMe,
  useLogout,
  getGetMeQueryKey,
  useGetDashboardAlerts,
  getGetDashboardAlertsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ScrollText,
  Utensils,
  TableProperties,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Bell,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/Brand";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ScrollText },
  { href: "/admin/menu", label: "Menu", icon: Utensils },
  { href: "/admin/tables", label: "Tables", icon: TableProperties },
  { href: "/admin/earnings", label: "Earnings", icon: TrendingUp },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useLocation();
  const me = useGetMe();
  const logout = useLogout();
  const qc = useQueryClient();
  const alerts = useGetDashboardAlerts({
    query: {
      queryKey: getGetDashboardAlertsQueryKey(),
      refetchInterval: 8000,
    },
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (me.isFetched && !me.data?.user) {
      setLoc("/admin/login");
    }
  }, [me.isFetched, me.data, setLoc]);

  if (me.isLoading || !me.data?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="font-display text-2xl text-ink-3">DineFlow</div>
      </div>
    );
  }

  const user = me.data.user;
  const alertCount = alerts.data?.length ?? 0;

  async function handleLogout() {
    await logout.mutateAsync();
    qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    setLoc("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-paper">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-ink text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div className="text-paper">
            <Wordmark />
          </div>
          <button
            type="button"
            className="lg:hidden text-paper/70"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 mt-2 mb-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-paper/40">
            Service of {new Date().toLocaleDateString("en-IN", { weekday: "long" })}
          </div>
          <div className="mt-1 font-display text-lg">
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
            })}
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map((item) => {
            const active = loc === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-paper"
                    : "text-paper/60 hover:text-paper hover:bg-sidebar-accent/60"
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/admin/dashboard" && alertCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-gold text-ink text-[10px] font-semibold">
                    {alertCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gold text-ink flex items-center justify-center font-semibold text-sm">
              {user.name
                .split(" ")
                .map((p: string) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-paper">
                {user.name}
              </div>
              <div className="text-[11px] text-paper/50 capitalize">
                {user.role.replace("_", " ")}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-paper/60 hover:text-paper p-1.5 rounded-lg hover:bg-white/5"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-paper hairline border-x-0 border-t-0 px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-paper-2"
          >
            <MenuIcon size={18} />
          </button>
          <Wordmark />
          <Link
            href="/admin/dashboard"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-paper-2"
          >
            <Bell size={16} />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gold" />
            )}
          </Link>
        </div>
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 py-6 lg:py-10">
          {children}
        </div>
      </main>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
