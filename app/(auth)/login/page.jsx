import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "Log in or Sign up | LàmViệc360",
  description: "Log in as a job seeker or company, or create a free LàmViệc360 account.",
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <LoginClient />
    </Suspense>
  );
}
