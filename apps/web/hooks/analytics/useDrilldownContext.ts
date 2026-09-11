import { useAppSelector } from "@/store/hooks";
import { selectActiveDrilldown } from "@/store/slices/drilldownSlice";
import { selectDomainId, selectFrom, selectTo, selectTimezone } from "@/store/slices/dashboardSlice";

export function useDrilldownContext() {
  return {
    drilldown: useAppSelector(selectActiveDrilldown),
    domainId: useAppSelector(selectDomainId),
    from: useAppSelector(selectFrom),
    to: useAppSelector(selectTo),
    timezone: useAppSelector(selectTimezone) ?? "UTC",
  };
}
