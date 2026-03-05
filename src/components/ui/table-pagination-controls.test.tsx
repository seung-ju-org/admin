import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange }: { children: ReactNode; onValueChange?: (v: string) => void }) => (
    <div>
      {children}
      <button onClick={() => onValueChange?.("20")} type="button">set-20</button>
    </div>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: () => <div>value</div>,
}));

import { TablePaginationControls } from "@/components/ui/table-pagination-controls";

describe("TablePaginationControls", () => {
  it("changes page size and page index", async () => {
    const user = userEvent.setup();
    const onPageIndexChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <TablePaginationControls
        pageIndex={1}
        pageSize={10}
        totalCount={95}
        onPageIndexChange={onPageIndexChange}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    expect(screen.getByText("Page 2 of 10")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "set-20" }));
    await user.click(screen.getByRole("button", { name: /Go to first page/i }));
    await user.click(screen.getByRole("button", { name: /Go to previous page/i }));
    await user.click(screen.getByRole("button", { name: /Go to next page/i }));
    await user.click(screen.getByRole("button", { name: /Go to last page/i }));

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
    expect(onPageIndexChange).toHaveBeenCalledWith(0);
    expect(onPageIndexChange).toHaveBeenCalledWith(0);
    expect(onPageIndexChange).toHaveBeenCalledWith(2);
    expect(onPageIndexChange).toHaveBeenCalledWith(9);
  });
});
