"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export type CheckerType = "spell" | "grammar";

interface HeaderProps {
  type: CheckerType;
  stats?: React.ReactNode;
  isLoading?: boolean;
}

const config = {
  spell: {
    title: "বানান",
    badge: "Spell Checker",
    gradient: "from-emerald-500 to-cyan-500",
    badgeColor: "text-emerald-600",
    badgeBg: "md:bg-emerald-500/10",
    navHref: "/grammar",
    navLabel: "Grammar",
    navIcon: "📝",
    navColor: "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20",
  },
  grammar: {
    title: "ব্যাকরণ",
    badge: "Grammar Checker",
    gradient: "from-amber-500 to-orange-500",
    badgeColor: "text-amber-600",
    badgeBg: "md:bg-amber-500/10",
    navHref: "/",
    navLabel: "Spelling",
    navIcon: "✏️",
    navColor: "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20",
  },
};

export function Header({ type, stats, isLoading }: HeaderProps) {
  const c = config[type];

  return (
    <div className="flex justify-between items-center px-6 py-3 bg-[var(--overlay-color)] border-b border-[var(--border-color)] shrink-0 gap-4">
      <div className="flex items-center gap-3">
        <Logo width={40} height={40} />
        <div className="flex flex-col md:flex-row md:gap-2 md:items-center">
          <span
            className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent leading-tight`}
          >
            {c.title}
          </span>
          <span
            className={`text-[10px] font-medium ${c.badgeColor} uppercase tracking-wide ${c.badgeBg} md:px-2 md:py-1 md:rounded-full`}
          >
            {c.badge}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {stats}
        {isLoading && (
          <span className="text-sm text-blue-400 animate-pulse max-sm:hidden">
            পরীক্ষা হচ্ছে...
          </span>
        )}
        <Link
          href={c.navHref}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${c.navColor} rounded-full transition-colors`}
        >
          <span className="max-sm:hidden">{c.navLabel}</span>
          <span>{c.navIcon}</span>
        </Link>
        <ThemeToggle />
      </div>
    </div>
  );
}
