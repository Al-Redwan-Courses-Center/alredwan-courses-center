import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";
import DataViewExportLegacy from "@/components/ui/data-view/DataViewExportLegacy";

export default function DataViewControlsLegacy({
  showSearch = true,
  showSort = true,
  showFilter = true,
  showExport = false,
  onExport,
}: {
  showSearch?: boolean;
  showSort?: boolean;
  showFilter?: boolean;
  showExport?: boolean;
  onExport?: () => void;
}) {
  return (
    <div className="relative z-100 mb-14 flex w-full items-center justify-between gap-16">
      <div className="flex flex-1 items-center gap-16">
        {showSearch && (
          <div className="max-w-[400px] flex-1">
            <DataViewSearch />
          </div>
        )}
        {showSort && <DataViewSort />}
        {showFilter && <DataViewFilter />}
      </div>
      {showExport && <DataViewExportLegacy onExport={onExport} />}
    </div>
  );
}
