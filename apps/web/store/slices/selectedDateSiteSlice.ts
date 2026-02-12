import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type intervals= "hour" |"day" | "week" |"month"

export interface SelectedDateSiteState {
  siteId: string | null;
  fromdate: string | null;
  todate: string | null;
  interval: intervals;
  
}

export const today:string= new Date().toISOString().split("T")[0] || " ";

export const initialState: SelectedDateSiteState = {
  siteId: null,
  fromdate: today,
  todate: today,
  interval: "hour",
 
};

export const selectedDateSiteSlice = createSlice({
  name: "selectedDateSiteId",
  initialState,
  reducers: {

    setSiteId(state, action: PayloadAction<string>) {
      state.siteId = action.payload;
    },
    setFromDate(state, action: PayloadAction<string>) {
      state.fromdate = action.payload;
    },
    setToDate(state, action: PayloadAction<string>) {
      state.todate = action.payload;
    },
    

    setInterval(state, action:PayloadAction<string>){
      if(action.payload==="day"){
        state.interval="day";
      }else if(action.payload==="hour"){
        state.interval="hour";
      }
      else if(action.payload==="week"){
        state.interval="week";
      }else if( action.payload==="month"){
        state.interval="month";
      }
    }
  },
});

export const { setSiteId, setFromDate, setToDate ,setInterval, } =
  selectedDateSiteSlice.actions;

export default selectedDateSiteSlice.reducer;
