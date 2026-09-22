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

export default function Header({ lang, setLang, app = "seeker" }) {
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState({ loggedIn: false });
  const [profile, setProfile] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Active dropdown states
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState({
    jobs: false,
    companies: false,
    services: false,
  });

  const dropdownTimeoutRef = useRef(null);

  const handleMouseEnter = (menuKey) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(menuKey);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 160);
  };

  const toggleDropdown = (menuKey) => {
    setActiveDropdown((current) => (current === menuKey ? null : menuKey));
  };

  const closeDropdown = () => {
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

    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("lv360-store", refreshData);
    document.addEventListener("visibilitychange", refreshData);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("lv360-store", refreshData);
      document.removeEventListener("visibilitychange", refreshData);
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    closeDropdown();
  }, [pathname]);

  const completeness = profile ? computeCompleteness(profile) : 0;
  const isVi = lang === "VN" || lang === "VI";

  const initials = (auth?.name || "User")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    logout();
    setAuth({ loggedIn: false });
    closeDropdown();
    router.push("/");
  };

  return (
    <header
      className={`sticky top-0 z-[100] w-full transition-all duration-200 ${
        scrolled
          ? "border-b border-gray-200/90 bg-white/95 shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-md"
          : "border-b border-gray-200/60 bg-white"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-4 sm:px-6">
        {/* Left Side: Brand Logo & Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Logo */}
          <Link
            href={auth.loggedIn ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 no-underline"
            aria-label="LàmViệc360 — Home"
          >
            <img
              src="/logo-cropped.png"
              alt="LàmViệc360"
              className="block h-[28px] w-auto transition-transform hover:scale-[1.02]"
            />
          </Link>

          {/* Naukri-Style Desktop Navigation Tabs */}
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label={t(lang, "Main navigation")}
          >
            {/* 1. JOBS MEGA MENU */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("jobs")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => toggleDropdown("jobs")}
                aria-expanded={activeDropdown === "jobs"}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  activeDropdown === "jobs" || pathname.startsWith("/jobs")
                    ? "text-blue-600 bg-blue-50/70"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <span>{isVi ? "Việc làm" : "Jobs"}</span>
                <Icon
                  name="chevron-down"
                  size={14}
                  style={{
                    transform: activeDropdown === "jobs" ? "rotate(180deg)" : "none",
                    transition: "transform 0.18s ease",
                  }}
                />
              </button>

              {/* Mega Menu Container */}
              {activeDropdown === "jobs" && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 w-[620px] rounded-2xl border border-gray-200/90 bg-white p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                >
                  <div className="grid grid-cols-3 gap-6">
                    {/* Column 1: Popular Categories */}
                    <div>
                      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                        <Icon name="briefcase" size={13} />
                        <span>{isVi ? "Ngành nghề hot" : "Popular Roles"}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Link
                          href="/jobs"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {isVi ? "Tất cả việc làm" : "All Jobs"}
                        </Link>
                        <Link
                          href="/jobs?q=IT"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {isVi ? "IT & Phần mềm" : "IT & Software Jobs"}
                        </Link>
                        <Link
                          href="/jobs?mode=Remote"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {isVi ? "Việc làm từ xa (Remote)" : "Remote / WFH Jobs"}
                        </Link>
                        <Link
                          href="/jobs?level=Entry-level"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {isVi ? "Mới tốt nghiệp / Fresher" : "Fresher & Entry-Level"}
                        </Link>
                        <Link
                          href="/jobs?sort=salary"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {isVi ? "Việc làm lương cao" : "High Salary Jobs"}
                        </Link>
                      </div>
                    </div>

                    {/* Column 2: Jobs by Location */}
                    <div>
                      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                        <Icon name="map-pin" size={13} />
                        <span>{isVi ? "Theo địa điểm" : "Top Locations"}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Link
                          href="/jobs?loc=Ho%20Chi%20Minh"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          TP. Hồ Chí Minh
                        </Link>
                        <Link
                          href="/jobs?loc=Ha%20Noi"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          Hà Nội
                        </Link>
                        <Link
                          href="/jobs?loc=Da%20Nang"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          Đà Nẵng
                        </Link>
                        <Link
                          href="/jobs?mode=Remote"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {isVi ? "Làm việc toàn quốc" : "Nationwide Remote"}
                        </Link>
                      </div>
                    </div>

                    {/* Column 3: Explore & Manage */}
                    <div>
                      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
                        <Icon name="sparkles" size={13} />
                        <span>{isVi ? "Khám phá" : "Explore"}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Link
                          href="/saved-jobs"
                          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <span>{isVi ? "Việc làm đã lưu" : "Saved Jobs"}</span>
                          {savedCount > 0 && (
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700">
                              {savedCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/applications"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {isVi ? "Đơn đã ứng tuyển" : "Applied Jobs"}
                        </Link>
                        <Link
                          href="/companies"
                          className="rounded-md px-2 py-1.5 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                        >
                          {isVi ? "Tìm theo công ty" : "Search by Company"}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Mega Menu Footer Banner */}
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/60 px-4 py-2.5 text-xs text-blue-900 border border-blue-100">
                    <span className="flex items-center gap-2 font-medium">
                      <Icon name="zap" size={14} style={{ color: "#2563eb" }} />
                      {isVi
                        ? "Tìm việc nhanh hơn với hệ thống AI đề xuất thông minh"
                        : "Fast-track your job search with AI matching recommendations"}
                    </span>
                    <Link
                      href="/jobs"
                      className="font-bold text-blue-700 hover:underline"
                    >
                      {isVi ? "Xem ngay →" : "Explore →"}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 2. COMPANIES DROPDOWN */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("companies")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => toggleDropdown("companies")}
                aria-expanded={activeDropdown === "companies"}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  activeDropdown === "companies" || pathname.startsWith("/companies")
                    ? "text-blue-600 bg-blue-50/70"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <span>{isVi ? "Công ty" : "Companies"}</span>
                <Icon
                  name="chevron-down"
                  size={14}
                  style={{
                    transform: activeDropdown === "companies" ? "rotate(180deg)" : "none",
                    transition: "transform 0.18s ease",
                  }}
                />
              </button>

              {activeDropdown === "companies" && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-2xl border border-gray-200/90 bg-white p-3 shadow-[0_18px_40px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                >
                  <Link
                    href="/companies"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Icon name="building-2" size={16} style={{ color: "#2563eb" }} />
                    <span>{isVi ? "Tất cả công ty" : "Explore All Companies"}</span>
                  </Link>
                  <Link
                    href="/companies?cat=tech"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Icon name="cpu" size={16} style={{ color: "#0891b2" }} />
                    <span>{isVi ? "Công ty Công nghệ & IT" : "Top Tech Companies"}</span>
                  </Link>
                  <Link
                    href="/companies?cat=mnc"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Icon name="globe" size={16} style={{ color: "#16a34a" }} />
                    <span>{isVi ? "Tập đoàn Đa quốc gia (MNC)" : "Top MNCs & Global Firms"}</span>
                  </Link>
                  <Link
                    href="/companies?cat=startups"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Icon name="rocket" size={16} style={{ color: "#ea580c" }} />
                    <span>{isVi ? "Startup & Kỳ lân mới nổi" : "Startups & Scaleups"}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 3. SERVICES (NAUKRI FASTFORWARD) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("services")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => toggleDropdown("services")}
                aria-expanded={activeDropdown === "services"}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  activeDropdown === "services" || pathname.startsWith("/resources") || pathname.startsWith("/resume")
                    ? "text-blue-600 bg-blue-50/70"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <span>{isVi ? "Dịch vụ nghề nghiệp" : "Services"}</span>
                <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                  AI
                </span>
                <Icon
                  name="chevron-down"
                  size={14}
                  style={{
                    transform: activeDropdown === "services" ? "rotate(180deg)" : "none",
                    transition: "transform 0.18s ease",
                  }}
                />
              </button>

              {activeDropdown === "services" && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-2xl border border-gray-200/90 bg-white p-3 shadow-[0_18px_40px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                >
                  <Link
                    href="/resume"
                    className="flex items-start gap-3 rounded-xl p-2.5 text-gray-800 hover:bg-blue-50 group"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon name="file-text" size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-bold group-hover:text-blue-600">
                        <span>{isVi ? "Tạo & Quét CV AI" : "AI Résumé Builder"}</span>
                        <span className="rounded-full bg-green-100 px-1.5 py-0.2 text-[9px] font-bold text-green-700">
                          {isVi ? "Miễn phí" : "Free"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {isVi ? "Tối ưu điểm ATS cho CV của bạn" : "ATS score check & smart tailoring"}
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/ai-interview-prep"
                    className="flex items-start gap-3 rounded-xl p-2.5 text-gray-800 hover:bg-blue-50 group"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Icon name="sparkles" size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-bold group-hover:text-blue-600">
                        <span>{isVi ? "Luyện phỏng vấn AI" : "AI Interview Prep"}</span>
                        <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-700">
                          HOT
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {isVi ? "Câu hỏi phỏng vấn theo vị trí" : "Role-specific simulated interviews"}
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/resources#salary"
                    className="flex items-start gap-3 rounded-xl p-2.5 text-gray-800 hover:bg-blue-50 group"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Icon name="calculator" size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold group-hover:text-blue-600">
                        {isVi ? "Tra cứu mức lương" : "Salary Calculator"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isVi ? "Mặt bằng lương thị trường theo năm kinh nghiệm" : "Market salary benchmarks across roles"}
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/resources"
                    className="flex items-start gap-3 rounded-xl p-2.5 text-gray-800 hover:bg-blue-50 group"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Icon name="book-open" size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold group-hover:text-blue-600">
                        {isVi ? "Cẩm nang nghề nghiệp" : "Career Resources & Blog"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isVi ? "Bí quyết phỏng vấn và thăng tiến sự nghiệp" : "Interview guides & career growth tips"}
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* If user is logged in, show Dashboard quick link */}
            {auth.loggedIn && (
              <Link
                href="/dashboard"
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  pathname === "/dashboard"
                    ? "text-blue-600 bg-blue-50/70"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                {isVi ? "Bảng tin" : "Dashboard"}
              </Link>
            )}
          </nav>
        </div>

        {/* Right Side: For Employers, Language Picker, and Auth CTAs */}
        <div className="flex items-center gap-3">
          {/* FOR EMPLOYERS (Naukri style - routes to localhost:3002) */}
          <div
            className="relative hidden lg:block"
            onMouseEnter={() => handleMouseEnter("employer")}
            onMouseLeave={handleMouseLeave}
          >
            <a
              href={EMPLOYER_URL}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/90 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
            >
              <span>{isVi ? "Dành cho Nhà tuyển dụng" : "For Employers"}</span>
              <Icon name="external-link" size={13} style={{ color: "#2563eb" }} />
            </a>

            {activeDropdown === "employer" && (
              <div
                className="absolute right-0 top-full z-50 mt-1 w-[260px] rounded-xl border border-gray-200/90 bg-white p-3 shadow-[0_14px_32px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-2 duration-150"
                role="menu"
              >
                <div className="mb-2 px-2 text-xs font-semibold text-gray-500">
                  {isVi ? "Cổng thông tin Nhà tuyển dụng" : "Employer Portal (Port 3002)"}
                </div>
                <a
                  href={EMPLOYER_URL}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Icon name="layout-grid" size={15} />
                  <span>{isVi ? "Vào trang Doanh nghiệp" : "Employer Home"}</span>
                </a>
                <a
                  href={`${EMPLOYER_URL}/company/post-job`}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Icon name="plus-circle" size={15} style={{ color: "#16a34a" }} />
                  <span>{isVi ? "Đăng tin tuyển dụng" : "Post a Job"}</span>
                </a>
                <a
                  href={`${EMPLOYER_URL}/login`}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-800 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Icon name="log-in" size={15} style={{ color: "#2563eb" }} />
                  <span>{isVi ? "Đăng nhập Doanh nghiệp" : "Employer Login"}</span>
                </a>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div
            className="relative hidden sm:block"
            onMouseEnter={() => handleMouseEnter("lang")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => toggleDropdown("lang")}
              aria-expanded={activeDropdown === "lang"}
              className="flex items-center gap-1 rounded-full border border-gray-200/90 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-blue-300 hover:bg-blue-50/50"
              aria-label="Switch Language"
            >
              <Icon name="globe" size={13} style={{ color: "#475569" }} />
              <span>{lang}</span>
              <Icon name="chevron-down" size={12} />
            </button>

            {activeDropdown === "lang" && (
              <div
                className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-gray-200/90 bg-white p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.1)]"
                role="listbox"
              >
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      closeDropdown();
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold ${
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

          <div className="hidden h-5 w-px bg-gray-200 sm:block" />

          {/* AUTH SECTION (LOGGED OUT VS LOGGED IN) */}
          {mounted && auth.loggedIn ? (
            /* Logged-In User Actions (Saved Jobs, Notifications & Naukri Profile Card) */
            <div className="flex items-center gap-2">
              {/* Saved Jobs Shortcut */}
              <Link
                href="/saved-jobs"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-red-500 transition-colors"
                aria-label="Saved Jobs"
                title={isVi ? "Việc đã lưu" : "Saved Jobs"}
              >
                <Icon
                  name="heart"
                  size={18}
                  style={savedCount > 0 ? { fill: "#ef4444", color: "#ef4444" } : {}}
                />
                {savedCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs">
                    {savedCount}
                  </span>
                )}
              </Link>

              {/* Notifications Shortcut */}
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                aria-label="Notifications"
                title={isVi ? "Thông báo" : "Notifications"}
              >
                <Icon name="bell" size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Naukri-Style User Profile Menu */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("profile")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown("profile")}
                  aria-expanded={activeDropdown === "profile"}
                  className="flex items-center gap-2 rounded-full border border-gray-200/90 bg-white p-1 pr-2.5 transition-colors hover:border-blue-400 hover:shadow-xs"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-xs">
                    {initials}
                  </span>
                  <span className="hidden max-w-[100px] truncate text-xs font-semibold text-gray-800 sm:inline-block">
                    {auth?.name?.split(" ")?.[0] || "Profile"}
                  </span>
                  <Icon
                    name="chevron-down"
                    size={13}
                    style={{
                      transform: activeDropdown === "profile" ? "rotate(180deg)" : "none",
                      transition: "transform 0.18s ease",
                      color: "#64748b",
                    }}
                  />
                </button>

                {/* Naukri User Profile Card Dropdown */}
                {activeDropdown === "profile" && (
                  <div
                    className="absolute right-0 top-full z-50 mt-1.5 w-[310px] rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_20px_45px_rgba(0,0,0,0.14)] animate-in fade-in slide-in-from-top-2 duration-150"
                    role="menu"
                  >
                    {/* User Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-base font-bold text-white shadow-sm">
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-gray-900">
                          {auth?.name || "Job Seeker"}
                        </div>
                        <div className="truncate text-xs text-gray-500">
                          {profile?.professional?.title || (isVi ? "Ứng viên" : "Job Seeker")}
                        </div>
                        <div className="truncate text-[11px] text-gray-400">
                          {auth?.email}
                        </div>
                      </div>
                    </div>

                    {/* Naukri Signature: Profile Completeness Meter */}
                    <div className="my-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/70 p-3 border border-blue-100/80">
                      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-700">
                          {isVi ? "Hoàn thiện hồ sơ" : "Profile Completeness"}
                        </span>
                        <span className="font-bold text-blue-700">{completeness}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/80">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
                          style={{ width: `${Math.max(completeness, 5)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">
                          {isVi ? "Để nhà tuyển dụng chú ý hơn" : "For 3x higher recruiter reach"}
                        </span>
                        <Link
                          href="/settings"
                          className="text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          {isVi ? "Cập nhật" : "Update"}
                        </Link>
                      </div>
                    </div>

                    {/* Menu Navigation Links */}
                    <div className="flex flex-col gap-0.5 text-sm font-medium text-gray-700">
                      <Link
                        href="/settings"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <Icon name="user" size={16} />
                        <span>{isVi ? "Hồ sơ của tôi" : "View & Update Profile"}</span>
                      </Link>
                      <Link
                        href="/resume"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <Icon name="file-text" size={16} />
                        <span>{isVi ? "Quản lý Résumé / CV" : "My Résumé"}</span>
                      </Link>
                      <Link
                        href="/applications"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <Icon name="send" size={16} />
                        <span>{isVi ? "Đơn đã ứng tuyển" : "My Applications"}</span>
                      </Link>
                      <Link
                        href="/interviews"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <Icon name="calendar" size={16} />
                        <span>{isVi ? "Lịch phỏng vấn" : "Scheduled Interviews"}</span>
                      </Link>
                      <Link
                        href="/saved-jobs"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <Icon name="heart" size={16} />
                        <span>{isVi ? "Công việc đã lưu" : "Saved Jobs"}</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50 hover:text-blue-600"
                      >
                        <Icon name="settings" size={16} />
                        <span>{isVi ? "Cài đặt tài khoản" : "Account Settings"}</span>
                      </Link>
                    </div>

                    {/* Divider & Logout */}
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Icon name="log-out" size={16} />
                        <span>{isVi ? "Đăng xuất" : "Sign Out"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Logged-Out Naukri-Style Auth CTAs: Clean Login + Coral-Orange Register */
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="whitespace-nowrap rounded-full border border-blue-600 px-4 py-1.5 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50/80"
              >
                {isVi ? "Đăng nhập" : "Login"}
              </Link>
              <Link
                href="/register"
                className="whitespace-nowrap rounded-full bg-[#f05537] px-5 py-2 text-sm font-bold text-white shadow-[0_2px_8px_rgba(240,85,55,0.28)] transition-all hover:bg-[#d94428] hover:shadow-[0_4px_14px_rgba(240,85,55,0.38)]"
              >
                {isVi ? "Đăng ký" : "Register"}
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 md:hidden"
            aria-label="Toggle Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Icon name={mobileOpen ? "x" : "menu"} size={22} />
          </button>
        </div>
      </div>

      {/* MOBILE RESPONSIVE DRAWER */}
      {mobileOpen && (
        <div className="max-h-[calc(100vh-68px)] overflow-y-auto border-t border-gray-200 bg-white px-5 pb-8 pt-4 shadow-xl md:hidden animate-in fade-in duration-150">
          {/* If Logged In, show Profile Summary Card in mobile */}
          {auth.loggedIn && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50/60 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-gray-900">{auth.name}</div>
                  <div className="truncate text-xs text-gray-500">{auth.email}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600">
                  {isVi ? "Hoàn thiện hồ sơ" : "Profile Completeness"}
                </span>
                <span className="font-bold text-blue-700">{completeness}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          )}

          {/* For Employers Banner (Mobile) */}
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/80 p-3">
            <div className="text-xs font-semibold text-blue-900">
              {isVi ? "Doanh nghiệp tuyển dụng?" : "Hiring for your team?"}
            </div>
            <a
              href={EMPLOYER_URL}
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:underline"
            >
              <span>{isVi ? "Vào cổng Nhà tuyển dụng (localhost:3002)" : "Go to Employer Portal (localhost:3002)"}</span>
              <Icon name="external-link" size={13} />
            </a>
          </div>

          {/* Accordion: Jobs */}
          <div className="border-b border-gray-100 py-2.5">
            <button
              type="button"
              className="flex w-full items-center justify-between py-1.5 text-base font-bold text-gray-800"
              onClick={() =>
                setMobileAccordion((s) => ({ ...s, jobs: !s.jobs }))
              }
            >
              <span>{isVi ? "Việc làm" : "Jobs"}</span>
              <Icon
                name="chevron-down"
                size={16}
                style={{
                  transform: mobileAccordion.jobs ? "rotate(180deg)" : "none",
                  transition: "transform 0.18s ease",
                }}
              />
            </button>
            {mobileAccordion.jobs && (
              <div className="flex flex-col gap-2 pl-3 pt-2 text-sm text-gray-600">
                <Link href="/jobs" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Tất cả việc làm" : "All Jobs"}
                </Link>
                <Link href="/jobs?q=IT" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Việc làm IT & Phần mềm" : "IT & Software Jobs"}
                </Link>
                <Link href="/jobs?mode=Remote" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Việc làm từ xa (Remote)" : "Remote / WFH Jobs"}
                </Link>
                <Link href="/jobs?level=Entry-level" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Mới tốt nghiệp / Fresher" : "Fresher & Entry-Level"}
                </Link>
                <Link href="/saved-jobs" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Việc làm đã lưu" : "Saved Jobs"}
                </Link>
              </div>
            )}
          </div>

          {/* Accordion: Companies */}
          <div className="border-b border-gray-100 py-2.5">
            <button
              type="button"
              className="flex w-full items-center justify-between py-1.5 text-base font-bold text-gray-800"
              onClick={() =>
                setMobileAccordion((s) => ({ ...s, companies: !s.companies }))
              }
            >
              <span>{isVi ? "Công ty" : "Companies"}</span>
              <Icon
                name="chevron-down"
                size={16}
                style={{
                  transform: mobileAccordion.companies ? "rotate(180deg)" : "none",
                  transition: "transform 0.18s ease",
                }}
              />
            </button>
            {mobileAccordion.companies && (
              <div className="flex flex-col gap-2 pl-3 pt-2 text-sm text-gray-600">
                <Link href="/companies" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Tất cả công ty" : "Explore All Companies"}
                </Link>
                <Link href="/companies?cat=tech" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Công ty Công nghệ & IT" : "Top Tech Companies"}
                </Link>
                <Link href="/companies?cat=mnc" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Tập đoàn Đa quốc gia" : "Top MNCs & Global Firms"}
                </Link>
              </div>
            )}
          </div>

          {/* Accordion: Services */}
          <div className="border-b border-gray-100 py-2.5">
            <button
              type="button"
              className="flex w-full items-center justify-between py-1.5 text-base font-bold text-gray-800"
              onClick={() =>
                setMobileAccordion((s) => ({ ...s, services: !s.services }))
              }
            >
              <span>{isVi ? "Dịch vụ nghề nghiệp" : "Career Services"}</span>
              <Icon
                name="chevron-down"
                size={16}
                style={{
                  transform: mobileAccordion.services ? "rotate(180deg)" : "none",
                  transition: "transform 0.18s ease",
                }}
              />
            </button>
            {mobileAccordion.services && (
              <div className="flex flex-col gap-2 pl-3 pt-2 text-sm text-gray-600">
                <Link href="/resume" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Tạo & Quét CV AI" : "AI Résumé Builder"}
                </Link>
                <Link href="/ai-interview-prep" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Luyện phỏng vấn AI" : "AI Interview Prep"}
                </Link>
                <Link href="/resources#salary" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Tra cứu mức lương" : "Salary Calculator"}
                </Link>
                <Link href="/resources" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                  {isVi ? "Cẩm nang nghề nghiệp" : "Career Advice & Blog"}
                </Link>
              </div>
            )}
          </div>

          {/* If Logged In, show quick links */}
          {auth.loggedIn && (
            <div className="border-b border-gray-100 py-2.5 flex flex-col gap-2 text-sm text-gray-800 font-semibold">
              <Link href="/dashboard" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                {isVi ? "Bảng tin cá nhân" : "Dashboard"}
              </Link>
              <Link href="/applications" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                {isVi ? "Đơn ứng tuyển của tôi" : "My Applications"}
              </Link>
              <Link href="/interviews" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                {isVi ? "Lịch phỏng vấn" : "Interviews"}
              </Link>
              <Link href="/settings" onClick={closeDropdown} className="py-1 hover:text-blue-600">
                {isVi ? "Cài đặt tài khoản" : "Account Settings"}
              </Link>
            </div>
          )}

          {/* Language Selector Mobile */}
          <div className="mt-4 flex items-center justify-between py-2 text-xs font-semibold text-gray-600">
            <span>{isVi ? "Ngôn ngữ" : "Language"}</span>
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

          {/* Auth Action Buttons Mobile */}
          <div className="mt-5 flex flex-col gap-2.5">
            {auth.loggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-center text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
              >
                {isVi ? "Đăng xuất" : "Sign Out"}
              </button>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={closeDropdown}
                  className="w-full rounded-xl bg-[#f05537] py-2.5 text-center text-sm font-bold text-white shadow-md hover:bg-[#d94428] transition-colors"
                >
                  {isVi ? "Đăng ký tài khoản miễn phí" : "Register For Free"}
                </Link>
                <Link
                  href="/login"
                  onClick={closeDropdown}
                  className="w-full rounded-xl border border-blue-600 py-2.5 text-center text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors"
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
