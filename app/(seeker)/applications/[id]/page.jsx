import ApplicationDetailClient from "./ApplicationDetailClient";

export const metadata = {
  title: "Application Status | LàmViệc360",
  description: "Full status timeline for your job application.",
};

export default async function Page({ params }) {
  const { id } = await params;
  return <ApplicationDetailClient id={id} />;
}
