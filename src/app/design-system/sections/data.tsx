"use client";

import { MotorcycleIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { BookingStatusBadge } from "@/components/customer/booking-status-badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { MotorcycleCardSkeleton } from "@/components/ui/skeleton";
import { type Booking, bookings } from "@/features/mock/data";
import { formatDate, formatPrice } from "@/lib/format";
import { Demo, Section } from "../section";

const columns: ColumnDef<Booking>[] = [
  { accessorKey: "reference", header: "Booking" },
  { accessorKey: "customer", header: "Customer" },
  { accessorKey: "bike", header: "Bike" },
  {
    accessorKey: "startDate",
    header: "Pickup",
    cell: ({ getValue }) => formatDate(getValue<string>(), { year: undefined }),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <BookingStatusBadge status={getValue<Booking["status"]>()} />,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ getValue }) => <span className="tabular font-semibold">{formatPrice(getValue<number>())}</span>,
  },
];

export function DataSection() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <Section id="data" title="Data and states" description="TanStack Table state rendered through HeroUI Table. Scrolls inside its container, never the page.">
      <Demo title="Data table (sortable, paginated)">
        <DataTable columns={columns} data={bookings} label="Bookings" pageSize={5} />
      </Demo>

      <div className="grid gap-8 md:grid-cols-2">
        <Demo title="Skeletons">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {loading ? (
                <>
                  <MotorcycleCardSkeleton />
                  <MotorcycleCardSkeleton />
                </>
              ) : (
                <p className="col-span-2 py-8 text-center text-sm text-subtle">Loaded. Reload the page to see skeletons again.</p>
              )}
            </div>
            <Button variant="secondary" size="sm" onPress={() => setLoading(true)} className="self-start">
              Show skeletons
            </Button>
          </div>
        </Demo>

        <Demo title="Empty state">
          <EmptyState
            icon={<MotorcycleIcon size={24} weight="fill" />}
            title="No bookings yet"
            action={<Button variant="outline" size="sm">Browse bikes</Button>}
          />
        </Demo>
      </div>
    </Section>
  );
}
