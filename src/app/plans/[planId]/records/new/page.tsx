import { NewRecordPageContent } from "@/components/plans/new-record-page-content";

type NewRecordPageProps = {
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

export default async function NewRecordPage({ params }: NewRecordPageProps) {
  const { planId } = await params;

  return <NewRecordPageContent planId={planId} />;
}
