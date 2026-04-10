import { notFound } from "next/navigation";
import { AddRecordForm } from "@/components/plans/add-record-form";
import { PageShell } from "@/components/page-shell";
import { getPlanById } from "@/lib/mock-data";

type NewRecordPageProps = {
  params: Promise<{ planId: string }>;
};

export function generateStaticParams() {
  return [
    { planId: "voice-lesson-10" },
    { planId: "morning-expression-30" },
    { planId: "running-endurance-20h" },
    { planId: "prompt-writing-15" },
  ];
}

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
