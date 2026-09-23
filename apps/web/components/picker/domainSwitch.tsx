"use client";

import { useDomain } from "@/hooks/domainCrud/useDomain";
import { DomainSwitcher } from "@workspace/ui/components/domain-switcher";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDomainId, selectDomainId } from "@/store/slices/dashboardSlice";


function useActiveDomainId() {
  const domainId = useAppSelector(selectDomainId);
  const { data: domains } = useDomain();

  return domainId || domains?.[0]?.id || "";
}

export default function DomainSwitch() {
  const dispatch = useAppDispatch();
  const { data: domains, isLoading, error } = useDomain();
  
  const activeDomainId = useActiveDomainId();

  if (isLoading) return <div>Loading domains...</div>;
  if (error)     return <div>Error: {error.message}</div>;

  return (
    <DomainSwitcher
      domains={domains ?? []}
      activeDomainId={activeDomainId}
      onSelect={(id: string) => dispatch(setDomainId(id))}
    />
  );
}
