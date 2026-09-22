"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SeekerHeader from "./SeekerHeader";
import SeekerBottomNav from "./SeekerBottomNav";
import Footer from "../layout/Footer";
import { useLang, t } from "../../utils/lang";

// Routes that run as a focused wizard — no full chrome so the user stays in the flow.
const FOCUSED = ["/onboarding"];

export default function SeekerShell({ children }) {
  const [lang, setLang] = useLang();
  const pathname = usePathname();
  const focused = FOCUSED.includes(pathname);

  if (focused) {
    return (
      <>
        <header className="sticky top-0 z-[100] border-b border-line bg-white/90 px-6 py-3.5 backdrop-blur-[6px]">
          <div className="mx-auto flex max-w-[900px] items-center justify-between">
            <img src="/logo-cropped.png" alt="LàmViệc360" className="block h-[26px] w-auto" />
            <Link href="/dashboard" className="text-sm font-semibold no-underline">
              {t(lang, "Save & exit")}
            </Link>
          </div>
        </header>
        <main className="min-h-[70vh]">{children}</main>
      </>
    );
  }

  return (
    <>
      <SeekerHeader lang={lang} setLang={setLang} />
      <main className="min-h-[60vh] max-md:pb-16">{children}</main>
      <Footer lang={lang} setLang={setLang} app="seeker" />
      <SeekerBottomNav lang={lang} />
    </>
  );
}
