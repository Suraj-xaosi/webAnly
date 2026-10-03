"use client";

import { useDomainSelection } from "@/hooks/domainCrud/useDomainSelection";
import { DomainSwitcher } from "@workspace/ui/components/domain-switcher";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useAppDispatch } from "@/store/hooks";
import { setDomainId } from "@/store/slices/dashboardSlice";

export default function DomainSwitch() {
  const dispatch = useAppDispatch();
  const {
    data: domains,
    isLoading,
    error,
    activeDomainId,
  } = useDomainSelection();

  if (isLoading) {
    return (
      <Skeleton
        className="h-10 w-40"
        role="status"
        aria-label="Loading domains"
      />
    );
  }
  if (error)     return <div>Error: {error.message}</div>;

  return (
    <DomainSwitcher
      domains={domains ?? []}
      activeDomainId={activeDomainId} 
      onSelect={(id: string) => dispatch(setDomainId(id))}
    />
  );
}
