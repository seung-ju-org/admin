import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  uuidv7: vi.fn(() => "019dbc00-1234-7123-9abc-1234567890ab"),
}));

vi.mock("uuidv7", () => ({
  uuidv7: mocks.uuidv7,
}));

import { createId } from "@/lib/id";

describe("createId", () => {
  it("returns uuidv7 id", () => {
    expect(createId()).toBe("019dbc00-1234-7123-9abc-1234567890ab");
    expect(mocks.uuidv7).toHaveBeenCalledTimes(1);
  });
});
