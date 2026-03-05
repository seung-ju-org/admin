"use client";

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageIndexChange: (next: number) => void;
  onPageSizeChange: (next: number) => void;
};

export function TablePaginationControls({
  pageIndex,
  pageSize,
  totalCount,
  onPageIndexChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <p className="text-sm text-muted-foreground">Rows per page</p>
        <Select
          onValueChange={(value) => onPageSizeChange(Number(value))}
          value={String(pageSize)}
        >
          <SelectTrigger className="h-8 w-[72px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm font-medium sm:text-right">
        Page {safePageIndex + 1} of {totalPages}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          className="hidden size-8 lg:flex"
          disabled={safePageIndex === 0}
          onClick={() => onPageIndexChange(0)}
          size="icon"
          type="button"
          variant="outline"
        >
          <IconChevronsLeft />
          <span className="sr-only">Go to first page</span>
        </Button>
        <Button
          className="size-8"
          disabled={safePageIndex === 0}
          onClick={() => onPageIndexChange(Math.max(0, safePageIndex - 1))}
          size="icon"
          type="button"
          variant="outline"
        >
          <IconChevronLeft />
          <span className="sr-only">Go to previous page</span>
        </Button>
        <Button
          className="size-8"
          disabled={safePageIndex >= totalPages - 1}
          onClick={() => onPageIndexChange(Math.min(totalPages - 1, safePageIndex + 1))}
          size="icon"
          type="button"
          variant="outline"
        >
          <IconChevronRight />
          <span className="sr-only">Go to next page</span>
        </Button>
        <Button
          className="hidden size-8 lg:flex"
          disabled={safePageIndex >= totalPages - 1}
          onClick={() => onPageIndexChange(totalPages - 1)}
          size="icon"
          type="button"
          variant="outline"
        >
          <IconChevronsRight />
          <span className="sr-only">Go to last page</span>
        </Button>
      </div>
    </div>
  );
}
