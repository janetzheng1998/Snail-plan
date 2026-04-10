import { notFound } from "next/navigation";
import { AddRecordForm } from "@/components/plans/add-record-form";
import { PageShell } from "@/components/page-shell";
import { getPlanById } from "@/lib/mock-data";

type NewRecordPageProps = {
  params: Promise<{ planId: string }>;
};

export default async function NewRecordPage({ params }: NewRecordPageProps) {
  const { planId } = await params;
  const plan = getPlanById(planId);

  if (!plan) {
    notFound();
  }

  return (
    <PageShell currentPath={`/plans/${plan.id}`}>
      <AddRecordForm planId={plan.id} planTitle={plan.title} />
    </PageShell>
  );
}
