"use client";

import Button from "~/app/components/UI/Button.tsx";
import { C } from "~/helpers/constants.ts";
import { usePageNumber } from "~/helpers/hooks.ts";

type Props = {
  totalEntries: number;
  pageSize?: number;
  disabled?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

function PaginationControls({ totalEntries, pageSize = C.defaultPageSize, disabled, className }: Props) {
  const [page, setPage] = usePageNumber();

  const totalPages = Math.ceil(totalEntries / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalEntries);

  return (
    <div className={`tw:my-2 tw:flex tw:flex-wrap tw:items-center tw:gap-2 ${className}`}>
      <Button className="btn-xs btn-secondary" onClick={() => setPage(page - 1)} disabled={disabled || page === 1}>
        Prev
      </Button>
      <div className="tw:flex tw:items-center tw:gap-2">
        <span>
          Page {page} of {totalPages}
        </span>
        {totalEntries > 0 && !disabled && (
          <span className="tw:font-mono text-muted tw:text-sm">
            ({from}-{to} of {totalEntries})
          </span>
        )}
      </div>
      <Button
        className="btn-xs btn-secondary"
        onClick={() => setPage(page + 1)}
        disabled={disabled || page >= totalPages}
      >
        Next
      </Button>
    </div>
  );
}

export default PaginationControls;
