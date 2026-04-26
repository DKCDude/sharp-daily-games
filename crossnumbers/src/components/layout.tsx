import { Link, useLocation } from "wouter";
import { useGetCurrentAuthUser, useGetCrossnumbersState, getGetCrossnumbersStateQueryKey } from "@workspace/api-client-react";
import { Trophy, History, Settings, LogOut, Menu, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { HowToPlayDialog } from "@/components/how-to-play-dialog";
import { useState } from "react";

const SHARP_DATE = (() => {
  const d = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);
  const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
  return `${weekday} · ${monthDay}`;
})();

function SharpLogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect width="100" height="100" rx="22" fill="#2563EB" />
      <text
        x="50" y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="system-ui,-apple-system,sans-serif"
        fontSize="60"
        fontWeight="500"
        fill="white"
      >S</text>
    </svg>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: authState } = useGetCurrentAuthUser();
  const { data: crossnumbersState } = useGetCrossnumbersState({
    query: {
      queryKey: getGetCrossnumbersStateQueryKey(),
      enabled: authState?.isAuthenticated,
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Today", icon: LayoutGrid },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
          <div
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </div>
        </Link>
      ))}
    </>
  );

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card">
        <div className="h-[3px] w-full" style={{ background: "#0891B2" }} />
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <SharpLogoMark size={22} />
            <span style={{ fontWeight: 500, letterSpacing: "-0.02em", fontSize: "14px" }}>
              Sharp<span style={{ color: "#2563EB" }}>·</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-1 tracking-wide">Crossnumbers</p>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1">
          <NavLinks />
          <HowToPlayDialog />
        </nav>

        <div className="px-3 pb-2 text-[10px] text-muted-foreground/60 tracking-wide">
          {SHARP_DATE}
        </div>

        {authState?.isAuthenticated && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                  {authState.user?.firstName?.[0] || authState.user?.email?.[0] || "?"}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium leading-none">{authState.user?.firstName || "Player"}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {crossnumbersState?.currentStreak || 0} day streak
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href="/api/logout">
                  <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-[3px] w-full md:hidden" style={{ background: "#0891B2" }} />
        <header className="md:hidden h-12 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SharpLogoMark size={20} />
            <span style={{ fontWeight: 500, letterSpacing: "-0.02em", fontSize: "13px" }}>
              Sharp<span style={{ color: "#2563EB" }}>·</span>
            </span>
            <span className="text-xs text-muted-foreground">Crossnumbers</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[260px] p-0 flex flex-col">
              <div className="h-[3px] w-full" style={{ background: "#0891B2" }} />
              <div className="p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <SharpLogoMark size={20} />
                  <span style={{ fontWeight: 500, letterSpacing: "-0.02em", fontSize: "14px" }}>
                    Sharp<span style={{ color: "#2563EB" }}>·</span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-1">Crossnumbers</p>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                <NavLinks />
                <HowToPlayDialog mobile />
              </nav>
              {authState?.isAuthenticated && (
                <div className="p-4 border-t border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                        {authState.user?.firstName?.[0] || authState.user?.email?.[0] || "?"}
                      </div>
                      <span className="text-sm font-medium">{authState.user?.firstName || "Player"}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href="/api/logout">
                        <LogOut className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
