import { Link } from "wouter";
import { Wordmark } from "@/components/Brand";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <Wordmark className="opacity-50" />
        <div className="font-display text-7xl mt-6 gold-text">404</div>
        <p className="text-ink-3 mt-3">
          The page you were looking for has slipped off the menu.
        </p>
        <Link
          href="/"
          className="btn-gold inline-block mt-6 rounded-full px-6 py-2.5 text-sm font-semibold"
        >
          Back to the table
        </Link>
      </div>
    </div>
  );
}
