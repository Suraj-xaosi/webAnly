import { useAppSelector } from "@/store/hooks"
import { selectDimensionTimeseriesSelection } from "@/store/slices/dimensionTimeseriesSlice"
import {
  selectDomainId,
  selectFrom,
  selectTo,
  selectTimezone,
} from "@/store/slices/dashboardSlice"

export function useDimensionTimeseriesContext() {
  return {
    selection: useAppSelector(selectDimensionTimeseriesSelection),
    domainId: useAppSelector(selectDomainId),
    from: useAppSelector(selectFrom),
    to: useAppSelector(selectTo),
    timezone: useAppSelector(selectTimezone) ?? "UTC",
  }
}
