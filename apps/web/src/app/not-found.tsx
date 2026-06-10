import Link from "next/link";
import { LayoutList, Home } from "lucide-react";

import { ThemeWrapper } from "../components/layout/theme-wrapper";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  return (
    <ThemeWrapper theme="paper">
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-4 py-16 sm:px-8 sm:py-24">
        <p className="text-xs uppercase tracking-[0.24em] text-foreground-muted">404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Page not found</h1>
        <p className="text-sm leading-7 text-foreground-muted">
          The page you requested does not exist or may have moved after a meeting ended.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/meetings">
            <Button leftIcon={<LayoutList size={16} strokeWidth={2} />}>
              Go to meetings
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" leftIcon={<Home size={16} strokeWidth={2} />}>
              Back home
            </Button>
          </Link>
        </div>
      </div>
    </ThemeWrapper>
  );
}
