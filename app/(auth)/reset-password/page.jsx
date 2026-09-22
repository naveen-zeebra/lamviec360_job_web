import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
  title: "Set a New Password | LàmViệc360",
  description: "Choose a new password for your LàmViệc360 job seeker account.",
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <ResetPasswordClient />
    </Suspense>
  );
}

