import { ReactNode } from "react";
import { DevPanel } from "@/components/dev-panel";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Activity, Trophy, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SHARP_DATE = (() => {
  const d = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);
  const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
  return `${weekday} · ${monthDay}`;
})();

export function Layout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Play", icon: Play },
    { href: "/streak", label: "Streak", icon: Activity },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <div className="h-[3px] w-full" style={{ background: "#7C3AED" }} />
      <header className="sticky top-0 z-50 w-full border-b border-[#e5e7eb] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="container mx-auto max-w-4xl h-12 flex items-center justify-between px-4">
          <Link href="/sharp/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <svg width="24" height="24" viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0 }}>
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
            <span style={{ fontWeight: 500, letterSpacing: "-0.02em", fontSize: "15px" }}>
              Sharp<span style={{ color: "#2563EB" }}>·</span>
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground font-medium tracking-wide pl-1 border-l border-border ml-0.5">
              Recollectify
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-3">
            {isAuthenticated && (
              <div className="flex items-center gap-1 mr-1 sm:mr-3">
                {navLinks.map((link) => {
                  const isActive = location === link.href;
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className={`gap-1.5 h-8 px-3 text-xs ${isActive ? "font-medium" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline-block">{link.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border border-border">
                      {user.profileImageUrl && (
                        <AvatarImage
                          src={user.profileImageUrl}
                          alt={[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User"}
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        <User className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-0.5 leading-none">
                      {(() => {
                        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
                        return name ? <p className="text-sm font-medium">{name}</p> : null;
                      })()}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => login()} size="sm" className="h-8 px-3 text-xs rounded-full font-medium">
                Sign in
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
          {children}
        </div>
      </main>
      <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border/40">
        {SHARP_DATE} · Sharp
      </footer>
      <DevPanel />
    </div>
  );
}
