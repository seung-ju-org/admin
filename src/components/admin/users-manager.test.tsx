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
  deleteUser: vi.fn(),
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

vi.mock("@/components/ui/confirm-action-button", () => ({
  ConfirmActionButton: ({ triggerLabel, onConfirm }: { triggerLabel: string; onConfirm: () => Promise<void> }) => (
    <button onClick={() => void onConfirm()} type="button">
      {triggerLabel}
    </button>
  ),
}));

vi.mock("@/components/ui/table-pagination-controls", () => ({
  TablePaginationControls: () => <div>pagination</div>,
}));

import { UsersManager } from "@/components/admin/users-manager";

const messages = new Proxy(
  {},
  {
    get: (_, property) => String(property),
  },
) as Record<string, string>;

describe("UsersManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sessionsByUserId: { u1: 2 } }),
    }) as typeof fetch;

    mocks.refetch.mockResolvedValue(undefined);
    mocks.deleteUser.mockResolvedValue({ data: { deleteUser: true } });
    mocks.useMutation.mockReturnValue([mocks.deleteUser, { loading: false }]);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading skeleton rows", () => {
    mocks.useQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: mocks.refetch,
    });

    render(<UsersManager locale="en" messages={messages as never} />);

    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("renders users and deletes selected user", async () => {
    const user = userEvent.setup();

    mocks.useQuery.mockReturnValue({
      data: {
        users: {
          totalCount: 1,
          items: [
            {
              id: "u1",
              username: "admin",
              email: "admin@seung-ju.com",
              name: "Admin",
              role: "ADMIN",
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

    render(<UsersManager locale="en" messages={messages as never} />);

    expect(await screen.findByText("admin")).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    await user.click(screen.getAllByRole("button", { name: "delete" })[0]);

    await waitFor(() => {
      expect(mocks.deleteUser).toHaveBeenCalledWith({ variables: { userId: "u1" } });
      expect(mocks.toastSuccess).toHaveBeenCalledWith("deleteSuccess");
    });
  });
});
