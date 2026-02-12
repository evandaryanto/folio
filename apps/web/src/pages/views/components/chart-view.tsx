import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { ChartViewConfig } from "@folio/contract/view";

const DEFAULT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
];

interface ChartViewProps {
  config: ChartViewConfig;
  data: Record<string, unknown>[];
  isLoading?: boolean;
}

export function ChartView({ config, data, isLoading }: ChartViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No data returned from composition
      </div>
    );
  }

  const colors = config.colors?.length ? config.colors : DEFAULT_COLORS;
  const showLegend = config.showLegend !== false;
  const showGrid = config.showGrid !== false;

  // Ensure numeric values for charts
  const chartData = data.map((row) => {
    const processed: Record<string, unknown> = { ...row };
    for (const field of config.yAxis) {
      const val = row[field];
      if (typeof val === "string") {
        processed[field] = parseFloat(val) || 0;
      }
    }
    return processed;
  });

  if (config.chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey={config.yAxis[0]}
            nameKey={config.xAxis}
            cx="50%"
            cy="50%"
            outerRadius={150}
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
            }
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (config.chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
          <XAxis
            dataKey={config.xAxis}
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} />
          <Tooltip />
          {showLegend && <Legend />}
          {config.yAxis.map((field, i) => (
            <Line
              key={field}
              type="monotone"
              dataKey={field}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (config.chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
          <XAxis
            dataKey={config.xAxis}
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} />
          <Tooltip />
          {showLegend && <Legend />}
          {config.yAxis.map((field, i) => (
            <Area
              key={field}
              type="monotone"
              dataKey={field}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar chart
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
        <XAxis
          dataKey={config.xAxis}
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} />
        <Tooltip />
        {showLegend && <Legend />}
        {config.yAxis.map((field, i) => (
          <Bar
            key={field}
            dataKey={field}
            fill={colors[i % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
