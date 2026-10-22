"use client";

import { Pagination as HeroPagination } from "@heroui/react";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  summary?: string;
};

function pagesToShow(page: number, count: number): (number | "gap")[] {
  if (count <= 5) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, count, page, page - 1, page + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({ page, pageCount, onPageChange, summary }: PaginationProps) {
  return (
    <HeroPagination className="@container w-full flex-wrap justify-between gap-y-2">
      {summary ? <HeroPagination.Summary>{summary}</HeroPagination.Summary> : null}
      <HeroPagination.Content className="flex-wrap">
        <HeroPagination.Item>
          <HeroPagination.Previous isDisabled={page === 1} onPress={() => onPageChange(page - 1)}>
            <HeroPagination.PreviousIcon />
            <span className="sr-only @md:not-sr-only">Previous</span>
          </HeroPagination.Previous>
        </HeroPagination.Item>
        {pagesToShow(page, pageCount).map((p, i) => (
          <HeroPagination.Item key={`${p}-${i}`}>
            {p === "gap" ? (
              <HeroPagination.Ellipsis />
            ) : (
              <HeroPagination.Link isActive={p === page} onPress={() => onPageChange(p)}>
                {p}
              </HeroPagination.Link>
            )}
          </HeroPagination.Item>
        ))}
        <HeroPagination.Item>
          <HeroPagination.Next isDisabled={page === pageCount} onPress={() => onPageChange(page + 1)}>
            <span className="sr-only @md:not-sr-only">Next</span>
            <HeroPagination.NextIcon />
          </HeroPagination.Next>
        </HeroPagination.Item>
      </HeroPagination.Content>
    </HeroPagination>
  );
}
