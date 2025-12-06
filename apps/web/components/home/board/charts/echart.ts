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
} from "echarts/components";

import { CanvasRenderer } from "echarts/renderers";

// Register only what you use across all charts
echarts.use([
  LineChart,
  BarChart,
  PieChart,
  MapChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  TransformComponent,
  VisualMapComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

export default echarts;
