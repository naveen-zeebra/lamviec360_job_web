import ApplyClient from "./ApplyClient";

export const metadata = {
  title: "Apply for this Job | LàmViệc360",
  description: "Submit your application in a few guided steps.",
};

export default async function Page({ params }) {
  const { jobId } = await params;
  return <ApplyClient jobId={parseInt(jobId, 10)} />;
}
