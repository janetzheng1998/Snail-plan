function withPlanId(path: string, planId: string): string {
  const params = new URLSearchParams({ planId });
  return `${path}?${params.toString()}`;
}

export function getPlanEditPath(planId: string): string {
  const params = new URLSearchParams({ planId });
  return `/plans/new?${params.toString()}`;
}

export function getPlanDetailPath(planId: string, isLocalPlan: boolean): string {
  return isLocalPlan ? withPlanId("/plans/local", planId) : `/plans/${planId}`;
}

export function getPlanNewRecordPath(planId: string, isLocalPlan: boolean): string {
  return isLocalPlan ? withPlanId("/plans/local/records/new", planId) : `/plans/${planId}/records/new`;
}

export function getPlanSummaryPath(planId: string, isLocalPlan: boolean): string {
  return isLocalPlan ? withPlanId("/plans/local/summary", planId) : `/plans/${planId}/summary`;
}
