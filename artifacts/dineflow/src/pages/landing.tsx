import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, QrCode, Sparkles, Utensils } from "lucide-react";
import { useListPublicTables } from "@workspace/api-client-react";
import { setTableCode } from "@/lib/session";
import { Wordmark } from "@/components/Brand";
import { Link } from "wouter";

export default function LandingPage() {
  const [, setLoc] = useLocation();
  const [code, setCode] = useState("");
  const tables = useListPublicTables();

  const tableList = Array.isArray(tables.data) ? tables.data : [];

  function pickTable(c: string) {
    setTableCode(c);
    setLoc("/menu");
  }

  return (
    <div className="app-shell">
      <div className="px-6 pt-10 pb-14 fade-in">
        <div className="flex items-center justify-between">
          <Wordmark />
          <Link
            href="/admin/login"
            className="text-xs uppercase tracking-wider text-ink-3 hover:text-ink"
          >
            Manager sign-in
          </Link>
        </div>

        <div className="mt-12">
          <span className="gold-stamp">An evening of slow indulgence</span>
          <h1 className="font-display text-[44px] leading-[1.05] mt-5">
            Welcome to the table.
          </h1>
          <p className="text-ink-3 mt-4 text-[15px] leading-relaxed max-w-[360px]">
            DineFlow lets you order at your own rhythm. No flagging, no waiting
            for the bill. Scan, sip, savour.
          </p>
        </div>

        <div className="paper-card mt-10 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper">
              <QrCode size={18} />
            </span>
            <div>
              <div className="font-medium">Scan the QR on your table</div>
              <div className="text-xs text-ink-3">
                Or enter your table code below.
              </div>
            </div>
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) pickTable(code.trim().toUpperCase());
            }}
          >
            <input
              className="input-paper uppercase tracking-widest font-mono"
              placeholder="e.g. T01"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={12}
            />
            <button type="submit" className="btn-ink rounded-xl px-5">
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-[0.18em] text-ink-3">
              Demo tables
            </div>
            <Sparkles size={14} className="text-gold" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {tables.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-[68px]" />
              ))
            ) : tableList.length > 0 ? (
              tableList.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTable(t.code)}
                  className="paper-card p-3 text-left hover:border-gold transition-colors group"
                >
                  <div className="flex items-baseline justify-between">
                    <div className="font-display text-lg">{t.label}</div>
                    <span className="font-mono text-[10px] uppercase text-ink-4">
                      {t.code}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-[11px] text-ink-3 inline-flex items-center gap-1.5">
                      <Utensils size={11} /> Seats {t.capacity}
                    </div>
                    <span className="text-[11px] text-gold-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      View menu →
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-2 paper-card p-4 text-center text-sm text-ink-3">
                No demo tables found. Enter table code manually, for example T01.
              </div>
            )}
          </div>
        </div>

        <div className="gold-divider mt-10" />
        <p className="mt-5 text-[12px] text-ink-4 text-center italic">
          “Cooking is at once child's play and adult joy.” — Craig Claiborne
        </p>
      </div>
    </div>
  );
}