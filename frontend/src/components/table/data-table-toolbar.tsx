// DataTableToolbar.tsx
import { Table } from "@tanstack/react-table";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

export interface Options {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  options: Options[];
  filterOptions: {
    columnId: string;
    title: string;
    options: Options[];
  }[];
  globalFilterColumnId?: string;
}

export function DataTableToolbar<TData>({ table, filterOptions, options  }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        {options.map((option) => (
          <Input
            key={option.value}
            value={option.value}
            onChange={(event) =>
              table.getColumn(option.value)?.setFilterValue(event.target.value)
            }
            className="h-8 px-2 lg:px-3"
          />
        ))}
        {/* <Input
          placeholder="Search..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        /> */}
        {/* 特定列过滤 */}
        <div className="flex gap-x-2">
          {filterOptions.map(({ columnId, title, options }) => (
            table.getColumn(columnId) && (
              <DataTableFacetedFilter
                key={columnId}
                column={table.getColumn(columnId)}
                title={title}
                options={options}
              />
            )
          ))}
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}