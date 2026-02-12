import { ViewType } from "@folio/contract/enums";
import type {
  ViewConfig,
  TableViewConfig,
  ChartViewConfig,
} from "@folio/contract/view";
import { TableView } from "./table-view";
import { ChartView } from "./chart-view";

interface ViewRendererProps {
  viewType: ViewType;
  config: ViewConfig;
  data: Record<string, unknown>[];
  isLoading?: boolean;
}

export function ViewRenderer({
  viewType,
  config,
  data,
  isLoading,
}: ViewRendererProps) {
  if (viewType === ViewType.Table) {
    return (
      <TableView
        config={config as TableViewConfig}
        data={data}
        isLoading={isLoading}
      />
    );
  }

  if (viewType === ViewType.Chart) {
    return (
      <ChartView
        config={config as ChartViewConfig}
        data={data}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="text-muted-foreground text-center py-8">
      Unsupported view type: {viewType}
    </div>
  );
}
