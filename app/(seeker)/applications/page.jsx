import ApplicationsClient from "./ApplicationsClient";

export const metadata = {
  title: "Application Tracker | LàmViệc360",
  description: "Track the status of every job you've applied to.",
};

export default function Page() {
  return <ApplicationsClient />;
}
