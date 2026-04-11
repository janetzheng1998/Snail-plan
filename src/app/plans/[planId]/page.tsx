import { PlanDetailPageContent } from "@/components/plans/plan-detail-page-content";

type PlanDetailPageProps = {
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

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { planId } = await params;

  return <PlanDetailPageContent planId={planId} />;
}
