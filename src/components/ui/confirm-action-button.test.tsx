import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

afterEach(() => {
  cleanup();
});

describe("ConfirmActionButton", () => {
  it("opens dialog and calls onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <ConfirmActionButton
        triggerLabel="삭제"
        title="정말 삭제할까요?"
        description="복구할 수 없습니다."
        confirmLabel="확인"
        cancelLabel="취소"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(screen.getByText("정말 삭제할까요?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "확인" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it("does not call onConfirm when canceled", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmActionButton
        triggerLabel="삭제"
        title="정말 삭제할까요?"
        description="복구할 수 없습니다."
        confirmLabel="확인"
        cancelLabel="취소"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "삭제" }));
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
