import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useLogin,
  useGetMe,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wordmark } from "@/components/Brand";
import { Eye, EyeOff, Lock, Sparkles } from "lucide-react";

const DEMOS = [
  {
    label: "Owner (super admin)",
    email: "owner@dineflow.test",
    password: "dineflow123",
  },
  {
    label: "Floor manager",
    email: "manager@dineflow.test",
    password: "dineflow123",
  },
];

export default function AdminLoginPage() {
  const [, setLoc] = useLocation();
  const me = useGetMe();
  const login = useLogin();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (me.data?.user) setLoc("/admin/dashboard");
  }, [me.data, setLoc]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ data: { email, password } });
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast.success("Welcome back.");
      setLoc("/admin/dashboard");
    } catch {
      toast.error("Invalid email or password.");
    }
  }

  return (
    <div className="min-h-screen w-full bg-ink text-paper grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(at 20% 20%, rgba(232,184,75,0.25), transparent 50%), radial-gradient(at 80% 80%, rgba(200,146,42,0.18), transparent 55%)",
          }}
        />
        <div className="relative z-10">
          <div className="text-paper">
            <Wordmark />
          </div>
          <span className="gold-stamp mt-12 inline-flex">
            Restaurant operating system
          </span>
          <h1 className="font-display text-5xl mt-6 leading-[1.05] max-w-md">
            The maître d's <span className="gold-text">leather-bound book</span>
            , reimagined.
          </h1>
          <p className="mt-5 text-paper/70 max-w-md leading-relaxed">
            Your tables, kitchen, and tips — all kept in calm order while you
            focus on hospitality.
          </p>
        </div>
        <div className="relative z-10 text-paper/50 text-xs italic">
          “Service is the rent we pay for the room we occupy.” — Shirley Chisholm
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-paper text-ink">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Wordmark />
          </div>
          <span className="gold-stamp">Manager sign-in</span>
          <h2 className="font-display text-3xl mt-3">Welcome back</h2>
          <p className="text-ink-3 mt-2 text-sm">
            Use your team credentials to enter the dashboard.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@restaurant.com"
                className="input-paper mt-1"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-paper pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={login.isPending}
              className="btn-gold w-full rounded-2xl py-3.5 text-base font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              {login.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 paper-card p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-4 inline-flex items-center gap-1.5">
              <Sparkles size={12} className="text-gold" /> Demo credentials
            </div>
            <div className="mt-2 space-y-1.5">
              {DEMOS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(d.password);
                  }}
                  className="w-full text-left text-sm bg-paper-2 hover:bg-paper-3 transition-colors rounded-lg px-3 py-2 flex items-center justify-between"
                >
                  <span>
                    <span className="font-medium">{d.label}</span>
                    <span className="block text-[11px] text-ink-3 font-mono">
                      {d.email}
                    </span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gold-3">
                    Tap to fill
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
