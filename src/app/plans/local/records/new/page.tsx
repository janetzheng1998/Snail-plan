import { Suspense } from "react";
import { LocalNewRecordContent } from "@/components/plans/local-new-record-content";

export default function LocalNewRecordPage() {
  return (
    <Suspense fallback={null}>
      <LocalNewRecordContent />
    </Suspense>
  );
}
