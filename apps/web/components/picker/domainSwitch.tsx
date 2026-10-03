"use client";

import { useEffect } from "react";
import { useDomain } from "@/hooks/domainCrud/useDomain";
import { DomainSwitcher } from "@workspace/ui/components/domain-switcher";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDomainId, selectDomainId } from "@/store/slices/dashboardSlice";

export default function DomainSwitch() {
  const dispatch = useAppDispatch();
  const domainId = useAppSelector(selectDomainId);
  const { data: domains, isLoading, error } = useDomain();

  const defaultDomainId = domains && domains.length > 0 ? domains[0]!.id : "";

  useEffect(() => {
    if (defaultDomainId && !domainId) {
      dispatch(setDomainId(defaultDomainId));
    }
  }, [defaultDomainId, dispatch, domainId]);

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

  const activeDomainId = domainId || defaultDomainId;

  return (
    <DomainSwitcher
      domains={domains ?? []}
      activeDomainId={activeDomainId} 
      onSelect={(id: string) => dispatch(setDomainId(id))}
    />
  );
}
