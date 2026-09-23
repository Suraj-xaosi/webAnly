"use client";

import { useDomain } from "@/hooks/domainCrud/useDomain";
import { DomainSwitcher } from "@workspace/ui/components/domain-switcher";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDomainId, selectDomainId } from "@/store/slices/dashboardSlice";

export default function DomainSwitch() {
  const dispatch = useAppDispatch();
  const domainId = useAppSelector(selectDomainId);
  const { data: domains, isLoading, error } = useDomain();

  if (isLoading) return <div>Loading domains...</div>;
  if (error)     return <div>Error: {error.message}</div>;

 
  const defaultDomainId = domains && domains.length > 0 ? domains[0]!.id : "";
  
  
  const activeDomainId = domainId || defaultDomainId;

 
  if (defaultDomainId && !domainId) {
    dispatch(setDomainId(defaultDomainId));
  }

  return (
    <DomainSwitcher
      domains={domains ?? []}
      activeDomainId={activeDomainId} 
      onSelect={(id: string) => dispatch(setDomainId(id))}
    />
  );
}
