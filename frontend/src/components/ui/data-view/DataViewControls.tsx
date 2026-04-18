import DataViewSearch from "@/components/ui/data-view/DataViewSearch";
import DataViewSort from "@/components/ui/data-view/DataViewSort";
import DataViewFilter from "@/components/ui/data-view/DataViewFilter";

export default function DataViewControls({
  showSearch = true,
  showSort = true,
  showFilter = true,
}: {
  showSearch?: boolean;
  showSort?: boolean;
  showFilter?: boolean;
}) {
  return (
    <div className="relative z-100 mb-14 flex items-center gap-32">
      {showSearch && <DataViewSearch />}
      {showSort && <DataViewSort />}
      {showFilter && <DataViewFilter />}
    </div>
  );
}
