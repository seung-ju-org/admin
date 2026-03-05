import type { ReactNode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  refetch: vi.fn(),
  deleteCareer: vi.fn(),
}));

vi.mock("@apollo/client/react", () => ({
  useQuery: mocks.useQuery,
  useMutation: mocks.useMutation,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock("@/components/ui/table-pagination-controls", () => ({
  TablePaginationControls: () => <div>pagination</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span>value</span>,
}));

import { CareersManager } from "@/components/admin/careers-manager";

const messages = new Proxy(
  {},
  {
    get: (_, property) => String(property),
  },
) as Record<string, string>;

describe("CareersManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.refetch.mockResolvedValue(undefined);
    mocks.deleteCareer.mockResolvedValue({ data: { deleteCareer: true } });
    mocks.useMutation.mockReturnValue([mocks.deleteCareer, { loading: false }]);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading skeleton", () => {
    mocks.useQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: mocks.refetch,
    });

    render(<CareersManager locale="en" messages={messages as never} />);

    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("renders career row and deletes career", async () => {
    const user = userEvent.setup();

    mocks.useQuery.mockReturnValue({
      data: {
        careers: {
          totalCount: 1,
          items: [
            {
              id: "c1",
              company: "Seung Ju",
              position: "Engineer",
              description: "desc",
              startDate: "2026-01-01T00:00:00.000Z",
              endDate: null,
              isCurrent: true,
              displayOrder: 1,
              isPublished: true,
              createdAt: "2026-03-01T00:00:00.000Z",
              updatedAt: "2026-03-02T00:00:00.000Z",
            },
          ],
        },
      },
      loading: false,
      error: undefined,
      refetch: mocks.refetch,
    });

    render(<CareersManager locale="en" messages={messages as never} />);

    expect(await screen.findByText("Seung Ju")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "delete" }));

    await waitFor(() => {
      expect(mocks.deleteCareer).toHaveBeenCalledWith({ variables: { careerId: "c1" } });
      expect(mocks.toastSuccess).toHaveBeenCalledWith("deleteSuccess");
    });
  });
});
