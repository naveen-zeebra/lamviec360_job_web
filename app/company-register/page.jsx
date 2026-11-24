"use client";
import { useEffect } from "react";
import { EMPLOYER_URL } from "../../config";

export default function CompanyRegisterRedirect() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace(`${EMPLOYER_URL}/company-register`);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-6 max-w-sm">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-800">Redirecting to Company Registration...</p>
        <p className="text-xs text-slate-500 mt-1">
          If you are not redirected automatically,{" "}
          <a href={`${EMPLOYER_URL}/company-register`} className="text-blue-600 underline font-medium">
            click here
          </a>.
        </p>
      </div>
    </div>
  );
}
