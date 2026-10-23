"use client";

import { Skeleton, Table, type SortDescriptor } from "@heroui/react";
import { type ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, type PaginationState, type SortingState, useReactTable } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useState } from "react";
import { AdminPagination } from "@/components/admin/controls";

type ControlledPagination = { page: number; pageSize: number; total: number; onPageChange: (page: number) => void };
export type AdminDataTableProps<T extends { id: string }> = {
  columns: ColumnDef<T>[];
  data: T[];
  label: string;
  pageSize?: number;
  pagination?: ControlledPagination;
  loading?: boolean;
  emptyState?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  onRowNavigate?: (row: T) => void;
  minWidth?: number;
  showPagination?: boolean;
};

export function AdminDataTable<T extends { id: string }>({ columns, data, label, pageSize = 6, pagination, loading = false, emptyState, rowActions, onRowNavigate, minWidth = 760, showPagination = true }: AdminDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [localPagination, setLocalPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const finalColumns: ColumnDef<T>[] = rowActions ? [...columns, { id: "actions", header: "", enableSorting: false, cell: ({ row }) => rowActions(row.original) }] : columns;
  const table = useReactTable({
    data, columns: finalColumns, state: { sorting, pagination: localPagination }, onSortingChange: setSorting, onPaginationChange: setLocalPagination,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: pagination || !showPagination ? undefined : getPaginationRowModel(),
    manualPagination: Boolean(pagination), pageCount: pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : undefined,
  });
  const currentPage = pagination?.page ?? localPagination.pageIndex + 1;
  const currentPageSize = pagination?.pageSize ?? localPagination.pageSize;
  const total = pagination?.total ?? data.length;
  const pageCount = pagination ? Math.max(1, Math.ceil(total / currentPageSize)) : Math.max(1, table.getPageCount());
  const sortDescriptor: SortDescriptor | undefined = sorting[0] ? { column: sorting[0].id, direction: sorting[0].desc ? "descending" : "ascending" } : undefined;
  const headers = table.getHeaderGroups()[0]?.headers ?? [];

  return <div className="min-w-0">
    <Table>
      <Table.ScrollContainer className="max-w-full overflow-x-auto">
        <Table.Content aria-label={label} style={{ minWidth }} sortDescriptor={sortDescriptor} onSortChange={(descriptor) => setSorting([{ id: String(descriptor.column), desc: descriptor.direction === "descending" }])}>
          <Table.Header>{headers.map((header, index) => <Table.Column key={header.id} id={header.id} isRowHeader={index === 0} allowsSorting={header.column.getCanSort()}>{flexRender(header.column.columnDef.header, header.getContext())}</Table.Column>)}</Table.Header>
          <Table.Body renderEmptyState={() => <div className="py-10 text-center text-sm text-[var(--admin-muted)]">{emptyState ?? "No records found."}</div>}>
            {loading ? Array.from({ length: 4 }, (_, index) => <Table.Row key={`loading-${index}`} id={`loading-${index}`}>{headers.map((header) => <Table.Cell key={header.id}><Skeleton className="h-5 w-3/4 rounded" /></Table.Cell>)}</Table.Row>) : table.getRowModel().rows.map((row) => <Table.Row key={row.original.id} id={row.original.id} onAction={onRowNavigate ? () => onRowNavigate(row.original) : undefined} className={onRowNavigate ? "cursor-pointer" : undefined}>{row.getVisibleCells().map((cell) => <Table.Cell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Table.Cell>)}</Table.Row>)}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      {showPagination ? <Table.Footer><AdminPagination page={currentPage} pageCount={pageCount} total={total} pageSize={currentPageSize} onPageChange={(page) => pagination ? pagination.onPageChange(page) : table.setPageIndex(page - 1)} /></Table.Footer> : null}
    </Table>
  </div>;
}
