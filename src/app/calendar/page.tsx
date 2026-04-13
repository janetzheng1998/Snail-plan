import { Suspense } from "react";
import { CalendarContent } from "@/components/plans/calendar-content";
import { PageShell } from "@/components/page-shell";

export default function CalendarPage() {
  return (
    <PageShell currentPath="/calendar">
      <Suspense fallback={null}>
        <CalendarContent />
      </Suspense>
    </PageShell>
  );
}
