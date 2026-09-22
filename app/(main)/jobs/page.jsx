import { Suspense } from "react";
import JobsClient from "./JobsClient";

export const metadata = {
  title: "Find Jobs in Vietnam | LàmViệc360",
  description: "Search jobs by role, skills, location, salary and work type across Vietnam on LàmViệc360.",
};

export default function Page() {
  return (
    <Suspense>
      <JobsClient />
    </Suspense>
  );
}
