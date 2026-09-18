"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "../ds/Icon";
import { LANGS, t } from "../../utils/lang";
import { unreadNotificationCount, logout, getAuth } from "../../lib/seekerStore";

const NAV = [
  { href: "/dashboard", labelKey: "Dashboard" },
  { href: "/jobs", labelKey: "Find Jobs" },
  { href: "/applications", labelKey: "Applications" },
  { href: "/interviews", labelKey: "Interviews" },
  { href: "/saved-jobs", labelKey: "Saved Jobs" },
];

const menuItem = "flex w-full items-center rounded-sm px-2.5 py-2 text-left text-sm text-ink hover:bg-brand-subtle hover:text-brand";

export default function SeekerHeader({ lang, setLang }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setUnread(unreadNotificationCount());
    setName(getAuth().name || "");
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const refresh = () => setUnread(unreadNotificationCount());
    window.addEventListener("lv360-store", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("lv360-store", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const initials = (name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-[100] border-b border-line bg-white/90 shadow-sm backdrop-blur-[6px] backdrop-saturate-[180%]">
      <div className="mx-auto flex max-w-[1200px] items-center gap-8 px-6 py-3.5">
        <Link href="/dashboard" className="flex items-center gap-3 no-underline" aria-label={t(lang, "LàmViệc360 — Dashboard")}>
          <img src="/logo-cropped.png" alt="LàmViệc360" className="block h-[26px] w-auto" />
        </Link>
        <nav className="flex flex-1 gap-6 max-[1080px]:hidden" aria-label={t(lang, "Seeker navigation")}>
          {NAV.map((n) => {
            const base = n.href.split("#")[0];
            const active = pathname === base || (base !== "/dashboard" && pathname.startsWith(base + "/"));
            return (
              <Link
                key={n.href}
                href={n.href}
                prefetch={true}
                className={`text-sm font-medium no-underline hover:text-brand hover:no-underline ${active ? "font-bold text-brand" : "text-ink"}`}
                aria-current={active ? "page" : undefined}
              >
                {t(lang, n.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link
            href="/notifications"
            className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-md text-ink hover:bg-brand-subtle hover:text-brand"
            aria-label={t(lang, "Notifications") + (unread ? `, ${unread} unread` : "")}
          >
            <Icon name="bell" size={20} />
            {unread > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-pill bg-danger px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <div className="relative">
            <button className="cursor-pointer border-none bg-transparent p-0" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={menuOpen}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-[13px] font-bold text-white">{initials}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[200px] rounded-md border border-line bg-card p-1.5 shadow-md" role="menu">
                <button role="menuitem" className={menuItem} onClick={() => router.push("/settings")}>
                  <Icon name="user" size={14} style={{ marginRight: 8 }} /> {t(lang, "Profile")}
                </button>
                <button role="menuitem" className={menuItem} onClick={() => router.push("/resume")}>
                  <Icon name="file-text" size={14} style={{ marginRight: 8 }} /> {t(lang, "My Résumé")}
                </button>
                <button role="menuitem" className={menuItem} onClick={() => router.push("/interviews")}>
                  <Icon name="calendar" size={14} style={{ marginRight: 8 }} /> {t(lang, "Interviews")}
                </button>
                <button role="menuitem" className={menuItem} onClick={() => router.push("/settings")}>
                  <Icon name="settings" size={14} style={{ marginRight: 8 }} /> {t(lang, "Settings")}
                </button>
                <button role="menuitem" className={menuItem} onClick={() => router.push("/ai-interview-prep")}>
                  <Icon name="sparkles" size={14} style={{ marginRight: 8 }} /> {t(lang, "AI Interview Prep")}
                </button>
                <div className="my-1.5 h-px bg-line" />
                <button
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                >
                  <Icon name="log-out" size={14} style={{ marginRight: 8 }} /> {t(lang, "Logout")}
                </button>
              </div>
            )}
          </div>
          <button className="cursor-pointer text-ink min-[1081px]:hidden" aria-label={t(lang, "Open menu")} aria-expanded={mobileOpen} onClick={() => setMobileOpen((v) => !v)}>
            <Icon name={mobileOpen ? "x" : "menu"} size={24} />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="flex flex-col gap-1 border-t border-line px-6 pb-5 pt-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="px-1 py-2.5 text-base text-ink no-underline">
              {t(lang, n.labelKey)}
            </Link>
          ))}
          <div className="my-1.5 h-px bg-line" />
          <Link href="/settings" className="px-1 py-2.5 text-base text-ink no-underline">
            {t(lang, "Settings")}
          </Link>
          <div className="flex gap-2 py-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                className={`rounded-pill border border-line bg-card px-4 py-1.5 text-sm text-muted ${lang === l.code ? "font-bold" : "font-normal"}`}
                onClick={() => setLang(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
