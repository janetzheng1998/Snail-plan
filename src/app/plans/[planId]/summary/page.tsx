import { PlanSummaryPageContent } from "@/components/plans/plan-summary-page-content";

type PlanSummaryPageProps = {
  params: Promise<{ planId: string }>;
};

export function generateStaticParams() {
  return [
    { planId: "voice-lesson-10" },
    { planId: "daily-speaking-30" },
    { planId: "running-endurance-20h" },
    { planId: "prompt-writing-15" }
  ];
}

export default async function PlanSummaryPage({ params }: PlanSummaryPageProps) {
  const { planId } = await params;

  return <PlanSummaryPageContent planId={planId} />;
}
