"use client";
import React from "react";

export type PaginationProps = {
  total: number;
  limit: number;
  offset: number;
  pageSizeOptions?: number[];
  onChange: (next: { limit?: number; offset?: number }) => void;
};

export default function Pagination({
  total,
  limit,
  offset,
  pageSizeOptions = [25, 50, 100],
  onChange,
}: PaginationProps) {
  const page = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  function gotoPage(p: number) {
    const clamped = Math.min(Math.max(1, p), pageCount);
    const nextOffset = (clamped - 1) * limit;
    onChange({ offset: nextOffset });
  }

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => gotoPage(1)}
          disabled={!canPrev}
          className="px-2 py-1 border rounded disabled:opacity-40"
          aria-label="First page"
        >
          «
        </button>
        <button
          type="button"
          onClick={() => gotoPage(page - 1)}
          disabled={!canPrev}
          className="px-2 py-1 border rounded disabled:opacity-40"
          aria-label="Previous page"
        >
          ‹
        </button>
        <div className="text-sm px-2 select-none">
          Page <span className="font-medium">{page}</span> of{" "}
          <span className="font-medium">{pageCount}</span>
        </div>
        <button
          type="button"
          onClick={() => gotoPage(page + 1)}
          disabled={!canNext}
          className="px-2 py-1 border rounded disabled:opacity-40"
          aria-label="Next page"
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => gotoPage(pageCount)}
          disabled={!canNext}
          className="px-2 py-1 border rounded disabled:opacity-40"
          aria-label="Last page"
        >
          »
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm">Rows per page</label>
        <select
          value={limit}
          onChange={(e) => onChange({ limit: Number(e.target.value), offset: 0 })}
          className="border rounded px-2 py-1"
          aria-label="Rows per page"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="text-xs opacity-70">
          Showing {Math.min(total, offset + 1)}–{Math.min(total, offset + limit)} of {total}
        </div>
      </div>
    </div>
  );
}
