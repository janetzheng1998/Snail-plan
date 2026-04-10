import { NewPlanForm } from "@/components/plans/new-plan-form";
import { PageShell } from "@/components/page-shell";

export default function NewPlanPage() {
  return (
    <PageShell currentPath="/plans/new">
      <NewPlanForm />
    </PageShell>
  );
}
