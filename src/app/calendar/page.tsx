import { PageShell } from "@/components/page-shell";
import { RecordCalendar } from "@/components/plans/record-calendar";
import { getPlanById } from "@/lib/mock-data";

export default function CalendarPage() {
  const plan = getPlanById("voice-lesson-10");

  return (
    <PageShell currentPath="/calendar">
      {plan ? <RecordCalendar records={plan.records} /> : null}
    </PageShell>
  );
}
