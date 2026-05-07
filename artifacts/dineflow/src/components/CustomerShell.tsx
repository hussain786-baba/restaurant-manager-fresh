import { type ReactNode } from "react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export function CustomerShell({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div className="app-shell">
      {header}
      <div className="px-5 pb-32 pt-4 fade-in">{children}</div>
    </div>
  );
}

export function CustomerHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title?: string;
  subtitle?: string;
  back?: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur-sm hairline border-x-0 border-t-0">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          {back ? (
            <Link
              href={back}
              className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-paper-2 transition-colors"
              aria-label="Back"
            >
              <ChevronLeft size={20} className="text-ink-2" />
            </Link>
          ) : null}
          <div className="min-w-0">
            {title ? (
              <div className="font-display text-[22px] leading-none truncate">
                {title}
              </div>
            ) : null}
            {subtitle ? (
              <div className="text-xs text-ink-3 mt-1 truncate">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
