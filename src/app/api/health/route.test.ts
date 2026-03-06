// @vitest-environment node
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 ok payload", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");

    const payload = (await res.json()) as { status: string; timestamp: string };
    expect(payload.status).toBe("ok");
    expect(typeof payload.timestamp).toBe("string");
  });
});
