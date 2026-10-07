import { useAppSelector } from "@/store/hooks"
import { selectDomainId } from "@/store/slices/dashboardSlice"
import { useDomainSummaries } from "./useDomainSummaries"

export function useDomainSelection() {
  const selectedDomainId = useAppSelector(selectDomainId)
  const domainQuery = useDomainSummaries()
  const domains = domainQuery.data

  const activeDomainId =
    selectedDomainId && domains?.some((domain) => domain.id === selectedDomainId)
      ? selectedDomainId
      : domains?.[0]?.id ?? ""

  return { ...domainQuery, activeDomainId }
}
