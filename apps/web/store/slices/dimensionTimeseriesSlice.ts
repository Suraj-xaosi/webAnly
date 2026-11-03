  import type { Dimension } from "@repo/types/analytics"
  import type { RootState } from "../store"

  export type DimensionTimeseriesMode = "historical" | "live"

  export interface DimensionTimeseriesSelection {
    dimension: Dimension
    value: string
    mode: DimensionTimeseriesMode
  }

  export interface DimensionTimeseriesState {
    selection: DimensionTimeseriesSelection | null
  }

  export const initialDimensionTimeseriesState: DimensionTimeseriesState = {
    selection: null,
  }

  export type DimensionTimeseriesAction =
    | { type: "dimensionTimeseries/openDimensionTimeseries"; payload: DimensionTimeseriesSelection }
    | { type: "dimensionTimeseries/closeDimensionTimeseries" }
    | { type: "dashboard/setDomainId" };

  export const dimensionTimeseriesReducer = (
    state: DimensionTimeseriesState = initialDimensionTimeseriesState,
    action: DimensionTimeseriesAction | { type: string; payload?: unknown }
  ): DimensionTimeseriesState => {
    switch (action.type) {
      case "dimensionTimeseries/openDimensionTimeseries":
        return { ...state, selection: action.payload as DimensionTimeseriesSelection }
      case "dimensionTimeseries/closeDimensionTimeseries":
        return { ...state, selection: null }
      case "dashboard/setDomainId":
        return { ...state, selection: null }
      default:
        return state
    }
  }

  export const openDimensionTimeseries = (payload: DimensionTimeseriesSelection) => ({
    type: "dimensionTimeseries/openDimensionTimeseries" as const,
    payload,
  })

  export const closeDimensionTimeseries = () => ({
    type: "dimensionTimeseries/closeDimensionTimeseries" as const,
  })

  export const selectDimensionTimeseriesSelection = (state: RootState) =>
    state.dimensionTimeseries.selection
