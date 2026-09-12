import { PAGE_SIZE } from '../../lib/listParams';

type PaginationProps = {
  page: number;
  total: number;
  onPage: (page: number) => void;
};

export function Pagination({ page, total, onPage }: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <nav
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-600">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="min-h-11 rounded-md border border-slate-300 px-4 text-base disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => {
            onPage(page - 1);
          }}
        >
          Previous
        </button>
        <button
          type="button"
          className="min-h-11 rounded-md border border-slate-300 px-4 text-base disabled:opacity-50"
          disabled={page >= lastPage}
          onClick={() => {
            onPage(page + 1);
          }}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
