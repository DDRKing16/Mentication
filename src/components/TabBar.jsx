import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home as HomeIcon, BookOpen, ClipboardList, BarChart3, Sparkles, Settings as SettingsIcon } from "lucide-react";
import { HOME_THEME } from "@/lib/homeTheme";

// Six-item bottom navigation: Home, Library, My Plan, Progress, Insights and
// Settings. Warm frosted-ivory bar, icon-over-label, gold dot under
// the active item. Fixed to the viewport and respects safe areas.
const TABS = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/plan", label: "My Plan", icon: ClipboardList },
  { to: "/profile", label: "Progress", icon: BarChart3 },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function TabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onHome = pathname === "/";

  if (!TABS.some((t) => t.to === pathname)) return null;

  return (
    <nav aria-label="Primary navigation" className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="safe-x">
        <div className={`${onHome ? `home-theme home-theme--${HOME_THEME} border-[var(--home-accent)]/25 bg-[var(--home-tabbar)]/95 shadow-[0_-14px_40px_-22px_var(--home-shadow)]` : "border-[#C99646]/25 bg-[#ECE2D2]/95 shadow-[0_-14px_40px_-22px_rgba(30,60,66,0.24)]"} pointer-events-auto mx-auto max-w-[36rem] rounded-t-[1.5rem] border-t px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl`}>
          <div className="grid grid-cols-6 items-stretch">
            {TABS.map((t) => {
              const active = pathname === t.to;
              const Icon = t.icon;
              return (
                <button
                  key={t.to}
                  type="button"
                  onClick={() => navigate(t.to)}
                  aria-label={t.label}
                  aria-current={active ? "page" : undefined}
                  className="no-tap relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl py-1.5 focus-visible:z-10"
                >
                  <Icon
                    className={`h-5 w-5 ${onHome ? (active ? "text-[var(--home-ink)]" : "text-[var(--home-muted)]") : (active ? "text-[#0E4536]" : "text-[#315E51]")}`}
                    strokeWidth={active ? 2 : 1.6}
                  />
                  <span className={`max-w-full truncate whitespace-nowrap text-[0.65rem] font-medium leading-none ${onHome ? (active ? "text-[var(--home-ink)]" : "text-[var(--home-muted)]") : (active ? "text-[#0E4536]" : "text-[#315E51]")}`}>
                    {t.label}
                  </span>
                  {active && (
                    <span className={`absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${onHome ? "bg-[var(--home-accent)]" : "bg-[#7A572E]"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
