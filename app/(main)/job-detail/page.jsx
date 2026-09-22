import { Suspense } from "react";
import JobDetailClient from "./JobDetailClient";

export const metadata = {
  title: "Job Details | LàmViệc360",
  description: "View the full job description, requirements and hiring process, then apply.",
};

export default function Page() {
  return (
    <Suspense>
      <JobDetailClient />
    </Suspense>
  );
}
