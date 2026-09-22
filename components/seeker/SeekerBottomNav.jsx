"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "../ds/Icon";
import { t } from "../../utils/lang";

const TABS = [
  { href: "/dashboard", icon: "layout-dashboard", labelKey: "Dashboard" },
  { href: "/jobs", icon: "search", labelKey: "Jobs" },
  { href: "/applications", icon: "briefcase", labelKey: "Applications" },
  { href: "/saved-jobs", icon: "heart", labelKey: "Saved" },
  { href: "/settings", icon: "user", labelKey: "Profile" },
];

export default function SeekerBottomNav({ lang }) {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[100] hidden border-t border-line bg-card px-1 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-2px_8px_rgba(21,23,27,0.06)] max-md:flex"
      aria-label={t(lang, "Primary")}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-semibold no-underline ${active ? "text-brand" : "text-faint"}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={tab.icon} size={20} />
            <span>{t(lang, tab.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
