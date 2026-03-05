import { describe, expect, it, vi } from "vitest";

import { extractErrorMessage, extractResponseMessage } from "@/lib/error-message";

describe("extractErrorMessage", () => {
  it("returns GraphQL error message first", () => {
    const message = extractErrorMessage({
      graphQLErrors: [{ message: "GraphQL failed" }],
      message: "fallback",
    });

    expect(message).toBe("GraphQL failed");
  });

  it("returns network error when GraphQL error is absent", () => {
    const message = extractErrorMessage({
      networkError: { result: { errors: [{ message: "Network failed" }] } },
      message: "fallback",
    });

    expect(message).toBe("Network failed");
  });

  it("falls back to generic error.message", () => {
    const message = extractErrorMessage({ message: "Plain error" });
    expect(message).toBe("Plain error");
  });

  it("returns null for invalid input", () => {
    expect(extractErrorMessage(null)).toBeNull();
    expect(extractErrorMessage("err")).toBeNull();
  });
});

describe("extractResponseMessage", () => {
  it("returns payload.message when present", async () => {
    const response = {
      json: vi.fn().mockResolvedValue({ message: "Bad request" }),
    } as unknown as Response;

    await expect(extractResponseMessage(response)).resolves.toBe("Bad request");
  });

  it("returns payload.error when message is absent", async () => {
    const response = {
      json: vi.fn().mockResolvedValue({ error: "Unauthorized" }),
    } as unknown as Response;

    await expect(extractResponseMessage(response)).resolves.toBe("Unauthorized");
  });

  it("returns null when body cannot be parsed", async () => {
    const response = {
      json: vi.fn().mockRejectedValue(new Error("invalid json")),
    } as unknown as Response;

    await expect(extractResponseMessage(response)).resolves.toBeNull();
  });
});
