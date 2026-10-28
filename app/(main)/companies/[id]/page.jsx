import { Suspense } from "react";
import CompanyShowcaseClient from "./CompanyShowcaseClient";

export const metadata = {
  title: "Company Showcase & Culture | LàmViệc360",
  description: "Explore company branding, mission, engineering culture, employee benefits, and active career opportunities.",
};

export default function CompanyShowcasePage() {
  return (
    <Suspense fallback={<div className="lv-loading-screen">Loading company showcase...</div>}>
      <CompanyShowcaseClient />
    </Suspense>
  );
}
