import { useAppSelector } from "@/store/hooks"
import { useDomainSelection } from "@/hooks/domainCrud/useDomainSelection"
import { selectDimensionTimeseriesSelection } from "@/store/slices/dimensionTimeseriesSlice"
import {
  selectFrom,
  selectTo,
  selectTimezone,
} from "@/store/slices/dashboardSlice"

export function useDimensionTimeseriesContext() {
  const { activeDomainId: domainId } = useDomainSelection()

  return {
    selection: useAppSelector(selectDimensionTimeseriesSelection),
    domainId,
    from: useAppSelector(selectFrom),
    to: useAppSelector(selectTo),
    timezone: useAppSelector(selectTimezone) ?? "UTC",
  }
}
