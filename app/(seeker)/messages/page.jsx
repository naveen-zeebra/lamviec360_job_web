import { Suspense } from "react";
import MessagesClient from "./MessagesClient";

export const metadata = {
  title: "Direct Messages | LàmViệc360",
};

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="lv-page-container">Loading direct messages...</div>}>
      <MessagesClient />
    </Suspense>
  );
}
