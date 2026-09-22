import InterviewDetailClient from "./InterviewDetailClient";

export const metadata = {
  title: "Interview Details | LàmViệc360",
  description: "Review your interview invitation and respond.",
};

export default async function Page({ params }) {
  const { id } = await params;
  return <InterviewDetailClient id={id} />;
}
