"use client";

import { useDomainSelection } from "@/hooks/domainCrud/useDomainSelection";
import { DomainSwitcher } from "@workspace/ui/components/domain-switcher";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Button } from "@workspace/ui/components/button";
import { useAppDispatch } from "@/store/hooks";
import { setDomainId } from "@/store/slices/dashboardSlice";

export default function DomainSwitch() {
  const dispatch = useAppDispatch();
  const {
    data: domains,
    isLoading,
    error,
    refetch,
    activeDomainId,
  } = useDomainSelection();

  if (isLoading && !domains) {
    return (
      <Skeleton
        className="h-10 w-40"
        role="status"
        aria-label="Loading domains"
      />
    );
  }
  if (error && !domains) {
    return (
      <div className="grid justify-items-start gap-2 text-sm" role="alert">
        <p className="text-destructive">
          Couldn’t load your domains. {error.message}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="grid justify-items-start gap-1">
      {error && (
        <p className="text-xs text-muted-foreground" role="status">
          Couldn’t refresh domains. Showing the last loaded list.
          <button
            type="button"
            className="ml-1 underline underline-offset-2"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </p>
      )}
      <DomainSwitcher
        domains={domains ?? []}
        activeDomainId={activeDomainId}
        onSelect={(id: string) => dispatch(setDomainId(id))}
      />
    </div>
  );
}
