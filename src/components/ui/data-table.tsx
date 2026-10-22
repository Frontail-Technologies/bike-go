"use client";

import { Table, type SortDescriptor } from "@heroui/react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";

type DataTableProps<T extends { id: string }> = {
  columns: ColumnDef<T>[];
  data: T[];
  label: string;
  pageSize?: number;
};

/**
 * TanStack Table owns sorting/pagination state; HeroUI Table owns the
 * accessible markup. Horizontal overflow stays inside the table container.
 */
export function DataTable<T extends { id: string }>({ columns, data, label, pageSize = 5 }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // TanStack Table returns unstable function identities; the compiler skips this component.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const sortDescriptor: SortDescriptor | undefined = sorting[0]
    ? { column: sorting[0].id, direction: sorting[0].desc ? "descending" : "ascending" }
    : undefined;

  const { pageIndex } = table.getState().pagination;
  const total = data.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label={label}
            sortDescriptor={sortDescriptor}
            onSortChange={(descriptor) => setSorting([{ id: String(descriptor.column), desc: descriptor.direction === "descending" }])}
          >
            <Table.Header>
              {table.getHeaderGroups()[0].headers.map((header, i) => (
                <Table.Column
                  key={header.id}
                  id={header.id}
                  isRowHeader={i === 0}
                  allowsSorting={header.column.getCanSort()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              {table.getRowModel().rows.map((row) => (
                <Table.Row key={row.original.id} id={row.original.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Cell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
      <Pagination
        page={pageIndex + 1}
        pageCount={table.getPageCount()}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        summary={`${from}-${to} of ${total}`}
      />
    </div>
  );
}
