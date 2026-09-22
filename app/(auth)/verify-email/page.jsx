import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata = {
  title: "Verify Your Email | LàmViệc360",
  description: "Confirm your email address to finish setting up your LàmViệc360 job seeker account.",
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <VerifyEmailClient />
    </Suspense>
  );
}

