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
  deleteProject: vi.fn(),
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

import { ProjectsManager } from "@/components/admin/projects-manager";

const messages = new Proxy(
  {},
  {
    get: (_, property) => String(property),
  },
) as Record<string, string>;

describe("ProjectsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.refetch.mockResolvedValue(undefined);
    mocks.deleteProject.mockResolvedValue({ data: { deleteProject: true } });
    mocks.useMutation.mockReturnValue([mocks.deleteProject, { loading: false }]);
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

    render(<ProjectsManager locale="en" messages={messages as never} />);

    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("renders project row and deletes project", async () => {
    const user = userEvent.setup();

    mocks.useQuery.mockReturnValue({
      data: {
        projects: {
          totalCount: 1,
          items: [
            {
              id: "p1",
              slug: "admin-panel",
              title: "Admin Panel",
              company: "Seung Ju",
              role: "Fullstack",
              technologies: ["Next.js", "Prisma"],
              displayOrder: 1,
              startDate: "2026-03-01T00:00:00.000Z",
              endDate: null,
              isOngoing: true,
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

    render(<ProjectsManager locale="en" messages={messages as never} />);

    expect(await screen.findByText("admin-panel")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "delete" }));

    await waitFor(() => {
      expect(mocks.deleteProject).toHaveBeenCalledWith({ variables: { projectId: "p1" } });
      expect(mocks.toastSuccess).toHaveBeenCalledWith("deleteSuccess");
    });
  });
});
