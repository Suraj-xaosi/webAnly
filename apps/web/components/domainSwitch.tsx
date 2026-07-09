//web/components/domainSwitch.tsx
"use client";

import { useEffect } from "react";
import { useDomain } from "@/hooks/useDomain";
import { DomainSwitcher } from "@workspace/ui/components/domain-switcher";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDomainId, selectDomainId } from "@/store/slices/dashboardSlice";

export default function DomainSwitch() {
  const dispatch   = useAppDispatch();
  const domainId   = useAppSelector(selectDomainId);
  const { data: domains, isLoading, error } = useDomain();

  // Auto-select first domain on load
  useEffect(() => {
    if (domains && domains.length > 0 && !domainId) {
      dispatch(setDomainId(domains[0]!.id));
    }
  }, [domains, domainId, dispatch]);

  if (isLoading) return <div>Loading domains...</div>;
  if (error)     return <div>Error: {error.message}</div>;

  return (
    <DomainSwitcher
      domains={domains ?? []}
      activeDomainId={domainId}
      onSelect={(id: string) => dispatch(setDomainId(id))}
    />
  );
}