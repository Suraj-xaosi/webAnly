// /lib/echarts.ts
import * as echarts from "echarts/core";
import {
  LineChart,
  BarChart,
  PieChart,
  MapChart,
  ScatterChart,
} from "echarts/charts";

import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  TransformComponent,
  VisualMapComponent,
  ToolboxComponent,
  GeoComponent, 
} from "echarts/components";

import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  MapChart,
  ScatterChart,

  // components
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  TransformComponent,
  VisualMapComponent,
  ToolboxComponent,
  GeoComponent, 

  CanvasRenderer,
]);

export default echarts;
