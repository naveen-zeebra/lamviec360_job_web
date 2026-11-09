"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { fetchActiveBanners, trackBannerClick } from "../../lib/api/bannerApi";
import Icon from "../ds/Icon";

export default function PromotionalBannerSection({ lang = "VN" }) {
  const isVi = lang === "VN" || lang === "VI";
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const data = await fetchActiveBanners("LANDING_HERO");
      if (mounted && Array.isArray(data) && data.length > 0) {
        setBanners(data);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-advance banner every 6 seconds if multiple banners exist
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, isPaused]);

  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  if (!currentBanner) return null;

  const headline = isVi
    ? currentBanner.headline || currentBanner.title
    : currentBanner.headline_en || currentBanner.headline || currentBanner.title;

  const description = isVi
    ? currentBanner.description
    : currentBanner.description_en || currentBanner.description;

  const ctaLabel = isVi
    ? currentBanner.cta_label || "Khám phá ngay"
    : currentBanner.cta_label_en || currentBanner.cta_label || "Explore Now";

  const handleCtaClick = () => {
    trackBannerClick(currentBanner.id);
  };

  const bgStyle = currentBanner.bg_gradient
    ? { background: currentBanner.bg_gradient }
    : {
        background:
          "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #06b6d4 100%)",
      };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative overflow-hidden rounded-2xl shadow-md text-white transition-all duration-500"
        style={bgStyle}
      >
        {/* Decorative background glow circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 px-6 py-7 sm:px-10 sm:py-9 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {currentBanner.badge_text && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 font-bold text-white border border-white/30 shadow-xs">
                  <Icon name="sparkles" size={12} className="text-amber-300" />
                  <span>{currentBanner.badge_text}</span>
                </span>
              )}
              {currentBanner.event_date && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-0.5 text-white/90">
                  <Icon name="calendar" size={12} />
                  <span>{currentBanner.event_date}</span>
                </span>
              )}
              {currentBanner.location_or_platform && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-0.5 text-white/90">
                  <Icon name="map-pin" size={12} />
                  <span>{currentBanner.location_or_platform}</span>
                </span>
              )}
            </div>

            {/* Headline */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight drop-shadow-xs">
              {headline}
            </h2>

            {/* Description */}
            {description && (
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-normal max-w-xl">
                {description}
              </p>
            )}

            {currentBanner.organizer && (
              <p className="text-[11px] text-white/75 italic">
                {isVi ? "Tổ chức bởi:" : "Organized by:"} {currentBanner.organizer}
              </p>
            )}
          </div>

          {/* CTA Button & Slide Controls */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4">
            {currentBanner.cta_url ? (
              currentBanner.open_in_new_tab ? (
                <a
                  href={currentBanner.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCtaClick}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-md hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{ctaLabel}</span>
                  <Icon name="external-link" size={14} className="text-slate-600" />
                </a>
              ) : (
                <Link
                  href={currentBanner.cta_url}
                  onClick={handleCtaClick}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-md hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{ctaLabel}</span>
                  <Icon name="arrow-right" size={14} className="text-slate-600" />
                </Link>
              )
            ) : null}

            {/* Carousel navigation dots */}
            {banners.length > 1 && (
              <div className="flex items-center gap-1.5 pt-1">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

