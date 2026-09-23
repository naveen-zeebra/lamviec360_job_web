"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "../ds/Icon";
import { LANGS, useLang, t } from "../../utils/lang";
import {
  getAuth,
  getProfile,
  computeCompleteness,
  listSavedJobs,
  unreadNotificationCount,
  logout,
} from "../../lib/seekerStore";
import { EMPLOYER_URL } from "../../lib/api/client";

/* ─── Underline hover style injected once ───────────────────────────── */
const NAV_LINK_BASE =
  "relative px-1 py-0.5 text-sm font-semibold text-gray-700 transition-colors duration-150 " +
  "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:rounded-full " +
  "after:bg-blue-500 after:transition-all after:duration-200 " +
  "hover:text-blue-600 hover:after:w-full";
const NAV_LINK_ACTIVE =
  "relative px-1 py-0.5 text-sm font-semibold text-blue-600 " +
  "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-blue-500";

export default function Header({ lang, setLang, app = "seeker" }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState({ loggedIn: false });
  const [profile, setProfile] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState({ jobs: false, companies: false });

  const dropdownTimeoutRef = useRef(null);

  const handleMouseEnter = (key) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(key);
  };
  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 160);
  };
  const toggleDropdown = (key) =>
    setActiveDropdown((curr) => (curr === key ? null : key));
  const closeAll = () => {
    setActiveDropdown(null);
    setMobileOpen(false);
  };

  const refreshData = () => {
    const a = getAuth();
    const p = getProfile();
    setAuth(a);
    setProfile(p);
    setSavedCount(listSavedJobs().length);
    setUnreadCount(unreadNotificationCount());
  };

  useEffect(() => {
    setMounted(true);
    refreshData();
    const onScroll = () => {};
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("lv360-store", refreshData);
    document.addEventListener("visibilitychange", refreshData);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("lv360-store", refreshData);
      document.removeEventListener("visibilitychange", refreshData);
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  useEffect(() => { closeAll(); }, [pathname]);

  const completeness = profile ? computeCompleteness(profile) : 0;
  const isVi = lang === "VN" || lang === "VI";
  const initials = (auth?.name || "U")
    .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const handleLogout = () => {
    logout();
    setAuth({ loggedIn: false });
    closeAll();
    router.push("/");
  };

  /* ── helper: dropdown menu wrapper ─────────────────────────────── */
  const DropMenu = ({ menuKey, children }) => (
    activeDropdown === menuKey ? (
      <div
        className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-2xl border border-gray-200/80 bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.10)] animate-in fade-in slide-in-from-top-2 duration-150"
        role="menu"
      >
        {children}
      </div>
    ) : null
  );

  /* ── helper: a single dropdown link ────────────────────────────── */
  const DropLink = ({ href, icon, children, badge }) => (
    <Link
      href={href}
      onClick={closeAll}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
    >
      {icon && <Icon name={icon} size={15} className="shrink-0 text-gray-400" />}
      <span className="flex-1">{children}</span>
      {badge && (
        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
          {badge}
        </span>
      )}
    </Link>
  );

  /* ─────────────────────────────────────────────────────────────── */
  /* PUBLIC nav links (always visible)                               */
  /* ─────────────────────────────────────────────────────────────── */
  const PublicNav = () => (
    <>
      {/* Jobs — plain link, no dropdown */}
      <Link
        href="/jobs"
        className={pathname.startsWith("/jobs") ? NAV_LINK_ACTIVE : NAV_LINK_BASE}
      >
        {isVi ? "Việc làm" : "Jobs"}
      </Link>

      {/* Companies — plain link, no dropdown */}
      <Link
        href="/companies"
        className={pathname.startsWith("/companies") ? NAV_LINK_ACTIVE : NAV_LINK_BASE}
      >
        {isVi ? "Công ty" : "Companies"}
      </Link>
    </>
  );

  /* ─────────────────────────────────────────────────────────────── */
  /* LOGGED‑IN nav links                                             */
  /* ─────────────────────────────────────────────────────────────── */
  const loggedInLinks = [
    { label: isVi ? "Bảng tin" : "Dashboard", path: "/dashboard", icon: "layout-dashboard" },
    { label: isVi ? "Tìm việc" : "Find Jobs", path: "/jobs", icon: "search" },
    { label: isVi ? "Ứng tuyển" : "Applications", path: "/applications", icon: "send" },
    { label: isVi ? "Phỏng vấn" : "Interviews", path: "/interviews", icon: "calendar" },
    { label: isVi ? "Việc đã lưu" : "Saved Jobs", path: "/saved-jobs", icon: "heart", badge: savedCount > 0 ? savedCount : null },
  ];

  /* ─────────────────────────────────────────────────────────────── */
  /* Language picker (shared)                                        */
  /* ─────────────────────────────────────────────────────────────── */
  const LangPicker = () => (
    <div
      className="relative"
      onMouseEnter={() => handleMouseEnter("lang")}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => toggleDropdown("lang")}
        aria-expanded={activeDropdown === "lang"}
        aria-label="Switch Language"
        className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
      >
        <Icon name="globe" size={13} />
        <span>{lang}</span>
        <Icon name="chevron-down" size={11} />
      </button>
      {activeDropdown === "lang" && (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-[140px] rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.09)]"
          role="listbox"
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLang(l.code); closeAll(); }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-colors ${
                lang === l.code
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{l.label}</span>
              {lang === l.code && <Icon name="check" size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <header className="sticky top-0 z-[100] w-full border-b border-gray-200/70 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-[66px] max-w-[1280px] items-center justify-between px-4 sm:px-6">

        {/* ── LEFT: Logo + Nav ─────────────────────────────────── */}
        <div className="flex items-center gap-7">
          {/* Logo */}
          <Link
            href={auth.loggedIn ? "/dashboard" : "/"}
            className="flex shrink-0 items-center gap-2 no-underline"
            aria-label="LàmViệc360 — Home"
          >
            <img
              src="/logo-cropped.png"
              alt="LàmViệc360"
              className="block h-[26px] w-auto transition-transform hover:scale-[1.03]"
            />
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-5 md:flex"
            aria-label={t(lang, "Main navigation")}
          >
            {mounted && auth.loggedIn ? (
              /* ── LOGGED‑IN nav ─────────────────────────────── */
              <>
                {loggedInLinks.map((lnk) => (
                  <Link
                    key={lnk.path}
                    href={lnk.path}
                    className={`flex items-center gap-1.5 ${pathname === lnk.path || pathname.startsWith(lnk.path + "/") ? NAV_LINK_ACTIVE : NAV_LINK_BASE}`}
                  >
                    {lnk.label}
                    {lnk.badge && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {lnk.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </>
            ) : (
              /* ── PUBLIC nav ────────────────────────────────── */
              <PublicNav />
            )}
          </nav>
        </div>

        {/* ── RIGHT: For Employers + Language + Auth / User controls ── */}
        <div className="flex items-center gap-3">

          {/* For Employers — right side pill */}
          {(!mounted || !auth.loggedIn) && (
            <a
              href={EMPLOYER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 lg:inline-flex"
            >
              <span>{isVi ? "Dành cho Nhà tuyển dụng" : "For Employers"}</span>
              <Icon name="external-link" size={12} style={{ color: "#2563eb" }} />
            </a>
          )}

          {/* Language picker — always visible on desktop */}
          <div className="hidden sm:block">
            <LangPicker />
          </div>

          <div className="hidden h-5 w-px bg-gray-200 sm:block" />

          {/* Auth controls */}
          {mounted && auth.loggedIn ? (
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-blue-600"
                aria-label={t(lang, "Notifications")}
                title={t(lang, "Notifications")}
              >
                <Icon name="bell" size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile avatar dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("profile")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown("profile")}
                  aria-expanded={activeDropdown === "profile"}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 pr-2.5 transition hover:border-blue-400 hover:shadow-sm"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-[11px] font-bold text-white">
                    {initials}
                  </span>
                  <span className="hidden max-w-[90px] truncate text-xs font-semibold text-gray-800 sm:inline-block">
                    {auth?.name?.split(" ")?.[0] || "Profile"}
                  </span>
                  <Icon
                    name="chevron-down"
                    size={12}
                    style={{
                      transform: activeDropdown === "profile" ? "rotate(180deg)" : "none",
                      transition: "transform 0.18s ease",
                      color: "#64748b",
                    }}
                  />
                </button>

                {/* Profile dropdown card */}
                {activeDropdown === "profile" && (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-[300px] rounded-2xl border border-gray-200/80 bg-white p-4 shadow-[0_20px_48px_rgba(0,0,0,0.13)] animate-in fade-in slide-in-from-top-2 duration-150"
                    role="menu"
                  >
                    {/* User header */}
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-base font-bold text-white">
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-gray-900">
                          {auth?.name || "Job Seeker"}
                        </div>
                        <div className="truncate text-xs text-gray-500">
                          {profile?.professional?.title || (isVi ? "Ứng viên" : "Job Seeker")}
                        </div>
                        <div className="truncate text-[11px] text-gray-400">{auth?.email}</div>
                      </div>
                    </div>

                    {/* Profile completeness */}
                    <div className="my-3 rounded-xl border border-blue-100/70 bg-gradient-to-r from-blue-50 to-indigo-50/60 p-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-700">
                          {isVi ? "Hoàn thiện hồ sơ" : "Profile Completeness"}
                        </span>
                        <span className="font-bold text-blue-700">{completeness}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/70">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                          style={{ width: `${Math.max(completeness, 5)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">
                          {isVi ? "Để nhà tuyển dụng chú ý hơn" : "3× higher recruiter visibility"}
                        </span>
                        <Link
                          href="/settings"
                          onClick={closeAll}
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          {isVi ? "Cập nhật" : "Update"}
                        </Link>
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="flex flex-col gap-0.5">
                      <DropLink href="/settings" icon="user" >{isVi ? "Hồ sơ của tôi" : "View & Update Profile"}</DropLink>
                      <DropLink href="/resume" icon="file-text">{isVi ? "Quản lý CV / Résumé" : "My Résumé"}</DropLink>
                      <DropLink href="/applications" icon="send">{isVi ? "Đơn đã ứng tuyển" : "My Applications"}</DropLink>
                      <DropLink href="/interviews" icon="calendar">{isVi ? "Lịch phỏng vấn" : "Interviews"}</DropLink>
                      <DropLink href="/saved-jobs" icon="heart" badge={savedCount > 0 ? savedCount : null}>
                        {isVi ? "Việc làm đã lưu" : "Saved Jobs"}
                      </DropLink>
                      <DropLink href="/settings" icon="settings">{isVi ? "Cài đặt tài khoản" : "Account Settings"}</DropLink>
                    </div>

                    {/* Logout */}
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Icon name="log-out" size={15} />
                        <span>{isVi ? "Đăng xuất" : "Sign Out"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Logged‑out CTA */
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="hidden whitespace-nowrap rounded-full border border-blue-600 px-4 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50/80 sm:inline-block"
              >
                {isVi ? "Đăng nhập" : "Login"}
              </Link>
              <Link
                href="/register"
                className="whitespace-nowrap rounded-full bg-[#f05537] px-4 py-1.5 text-sm font-bold text-white shadow-[0_2px_8px_rgba(240,85,55,0.26)] transition hover:bg-[#d94428] hover:shadow-[0_4px_14px_rgba(240,85,55,0.36)]"
              >
                {isVi ? "Đăng ký" : "Register"}
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Toggle Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Icon name={mobileOpen ? "x" : "menu"} size={22} />
          </button>
        </div>
      </div>

      {/* ── MOBILE DRAWER ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="max-h-[calc(100vh-66px)] overflow-y-auto border-t border-gray-200 bg-white px-5 pb-8 pt-4 shadow-xl md:hidden animate-in fade-in duration-150">

          {/* Logged‑in profile card */}
          {mounted && auth.loggedIn && (
            <div className="mb-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50/70 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-sm font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-gray-900">{auth.name}</div>
                  <div className="truncate text-xs text-gray-500">{auth.email}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-600">{isVi ? "Hoàn thiện hồ sơ" : "Profile Completeness"}</span>
                  <span className="text-blue-700">{completeness}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${completeness}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* For Employers banner */}
          {(!mounted || !auth.loggedIn) && (
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/80 p-3">
              <div className="text-xs font-semibold text-blue-900">
                {isVi ? "Doanh nghiệp tuyển dụng?" : "Hiring for your team?"}
              </div>
              <a
                href={EMPLOYER_URL}
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{isVi ? "Vào cổng Nhà tuyển dụng" : "Go to Employer Portal"}</span>
                <Icon name="external-link" size={13} />
              </a>
            </div>
          )}

          {/* Nav links */}
          {mounted && auth.loggedIn ? (
            /* Logged‑in quick links */
            <div className="flex flex-col gap-1 border-b border-gray-100 pb-4">
              {loggedInLinks.map((lnk) => (
                <Link
                  key={lnk.path}
                  href={lnk.path}
                  onClick={closeAll}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                >
                  <Icon name={lnk.icon} size={16} className="text-gray-400" />
                  {lnk.label}
                  {lnk.badge && (
                    <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {lnk.badge}
                    </span>
                  )}
                </Link>
              ))}
              <Link href="/settings" onClick={closeAll} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600">
                <Icon name="settings" size={16} className="text-gray-400" />
                {isVi ? "Cài đặt tài khoản" : "Account Settings"}
              </Link>
            </div>
          ) : (
            /* Public accordion links */
            <>
              <div className="border-b border-gray-100 py-2.5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-1.5 text-base font-bold text-gray-800"
                  onClick={() => setMobileAccordion((s) => ({ ...s, jobs: !s.jobs }))}
                >
                  <span>{isVi ? "Việc làm" : "Jobs"}</span>
                  <Icon name="chevron-down" size={16} style={{ transform: mobileAccordion.jobs ? "rotate(180deg)" : "none", transition: "transform 0.18s ease" }} />
                </button>
                {mobileAccordion.jobs && (
                  <div className="flex flex-col gap-1 pl-3 pt-2 text-sm text-gray-600">
                    {[
                      ["/jobs", isVi ? "Tất cả việc làm" : "All Jobs"],
                      ["/jobs?q=IT", isVi ? "IT & Phần mềm" : "IT & Software"],
                      ["/jobs?mode=Remote", isVi ? "Việc làm Remote" : "Remote / WFH"],
                      ["/jobs?level=Entry-level", isVi ? "Fresher / Mới tốt nghiệp" : "Fresher & Entry‑Level"],
                      ["/saved-jobs", isVi ? "Việc làm đã lưu" : "Saved Jobs"],
                    ].map(([href, label]) => (
                      <Link key={href} href={href} onClick={closeAll} className="rounded-lg px-2 py-1.5 hover:bg-gray-50 hover:text-blue-600">{label}</Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-b border-gray-100 py-2.5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-1.5 text-base font-bold text-gray-800"
                  onClick={() => setMobileAccordion((s) => ({ ...s, companies: !s.companies }))}
                >
                  <span>{isVi ? "Công ty" : "Companies"}</span>
                  <Icon name="chevron-down" size={16} style={{ transform: mobileAccordion.companies ? "rotate(180deg)" : "none", transition: "transform 0.18s ease" }} />
                </button>
                {mobileAccordion.companies && (
                  <div className="flex flex-col gap-1 pl-3 pt-2 text-sm text-gray-600">
                    {[
                      ["/companies", isVi ? "Tất cả công ty" : "Explore All Companies"],
                      ["/companies?cat=tech", isVi ? "Công ty Công nghệ & IT" : "Top Tech Companies"],
                      ["/companies?cat=mnc", isVi ? "Tập đoàn Đa quốc gia" : "MNCs & Global Firms"],
                      ["/companies?cat=startups", isVi ? "Startup & Scaleup" : "Startups & Scaleups"],
                    ].map(([href, label]) => (
                      <Link key={href} href={href} onClick={closeAll} className="rounded-lg px-2 py-1.5 hover:bg-gray-50 hover:text-blue-600">{label}</Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Language switcher */}
          <div className="mt-4 flex items-center justify-between py-2 text-xs font-semibold text-gray-600">
            <span className="flex items-center gap-1.5">
              <Icon name="globe" size={13} />
              {isVi ? "Ngôn ngữ" : "Language"}
            </span>
            <div className="flex gap-1.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    lang === l.code
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auth buttons */}
          <div className="mt-5 flex flex-col gap-2.5">
            {mounted && auth.loggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-center text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                {isVi ? "Đăng xuất" : "Sign Out"}
              </button>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={closeAll}
                  className="w-full rounded-xl bg-[#f05537] py-2.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#d94428]"
                >
                  {isVi ? "Đăng ký miễn phí" : "Register For Free"}
                </Link>
                <Link
                  href="/login"
                  onClick={closeAll}
                  className="w-full rounded-xl border border-blue-600 py-2.5 text-center text-sm font-bold text-blue-600 transition hover:bg-blue-50"
                >
                  {isVi ? "Đăng nhập" : "Login"}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

