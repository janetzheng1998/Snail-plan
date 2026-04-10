import { PageShell } from "@/components/page-shell";
import { PlanCard } from "@/components/plans/plan-card";
import { getActivePlans, getCompletedPlans } from "@/lib/mock-data";

export default function MyPlansPage() {
  const activePlans = getActivePlans();
  const completedPlans = getCompletedPlans();

  return (
    <PageShell currentPath="/plans">
      <section className="space-y-4">
        <h3 className="text-2xl text-ink-900">进行中的计划</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {activePlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} mode="active" />
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <h3 className="text-2xl text-ink-900">已完成的计划</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {completedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} mode="completed" />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
