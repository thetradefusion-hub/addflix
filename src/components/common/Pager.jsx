import { useEffect, useState } from "react";

export function usePaging(items, size = 8, resetKey) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [resetKey]);
  const list = items || [];
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, pages);
  const start = (current - 1) * size;
  return {
    page: current,
    pages,
    total,
    size,
    start,
    items: list.slice(start, start + size),
    setPage,
  };
}

export default function Pager({ page, pages, total, size, onChange }) {
  if (!total || pages <= 1) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);
  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#667085]">
      <span>Showing {from}–{to} of {total}</span>
      <div className="flex gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-[#eaecf0] px-2 py-1 disabled:opacity-40">Prev</button>
        <span className="rounded-lg bg-[#e10600] px-2 py-1 font-bold text-white">{page}</span>
        <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border border-[#eaecf0] px-2 py-1 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
