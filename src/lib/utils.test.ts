import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and resolves tailwind conflicts", () => {
    expect(cn("p-2", "p-4", "text-sm", false && "hidden")).toBe("p-4 text-sm");
  });
});
