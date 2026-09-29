import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Dimension } from "@/lib/shared/types/analytics"
import { setDomainId } from "./dashboardSlice"
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

const initialState: DimensionTimeseriesState = {
  selection: null,
}

const dimensionTimeseriesSlice = createSlice({
  name: "dimensionTimeseries",
  initialState,
  reducers: {
    openDimensionTimeseries(
      state,
      action: PayloadAction<DimensionTimeseriesSelection>
    ) {
      state.selection = action.payload
    },
    closeDimensionTimeseries(state) {
      state.selection = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setDomainId, (state) => {
      state.selection = null
    })
  },
})

export const { openDimensionTimeseries, closeDimensionTimeseries } =
  dimensionTimeseriesSlice.actions
export const selectDimensionTimeseriesSelection = (state: RootState) =>
  state.dimensionTimeseries.selection
export default dimensionTimeseriesSlice.reducer
