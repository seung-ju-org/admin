import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("GraphqlProvider", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("wraps children and shows deduped query error toast", async () => {
    let capturedOnError: ((input: { operation: { query: { definitions: Array<{ kind: string; operation: string }> } }; error: unknown }) => void) | undefined;
    const toastError = vi.fn();

    const apolloProvider = vi.fn(({ children }: { children: React.ReactNode }) => (
      <div data-testid="apollo-provider">{children}</div>
    ));

    vi.doMock("@apollo/client/core", () => ({
      ApolloClient: vi.fn(function ApolloClient() {}),
      HttpLink: vi.fn(function HttpLink() {}),
      InMemoryCache: vi.fn(function InMemoryCache() {}),
      from: vi.fn(() => ({})),
    }));

    vi.doMock("@apollo/client/link/error", () => ({
      onError: vi.fn((cb: typeof capturedOnError) => {
        capturedOnError = cb;
        return {};
      }),
    }));

    vi.doMock("@apollo/client/react", () => ({
      ApolloProvider: apolloProvider,
    }));

    vi.doMock("sonner", () => ({
      toast: {
        error: toastError,
      },
    }));

    vi.doMock("@/lib/error-message", () => ({
      extractErrorMessage: vi.fn(() => "query failed"),
    }));

    const { GraphqlProvider } = await import("@/components/providers/apollo-provider");

    render(
      <GraphqlProvider>
        <span>child</span>
      </GraphqlProvider>,
    );

    expect(screen.getByTestId("apollo-provider")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();

    vi.spyOn(Date, "now").mockReturnValueOnce(1_000).mockReturnValueOnce(1_500);

    capturedOnError?.({
      operation: { query: { definitions: [{ kind: "OperationDefinition", operation: "query" }] } },
      error: new Error("boom"),
    });
    capturedOnError?.({
      operation: { query: { definitions: [{ kind: "OperationDefinition", operation: "query" }] } },
      error: new Error("boom"),
    });

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith("query failed");
  });

  it("skips toast for mutations", async () => {
    let capturedOnError: ((input: { operation: { query: { definitions: Array<{ kind: string; operation: string }> } }; error: unknown }) => void) | undefined;
    const toastError = vi.fn();

    vi.doMock("@apollo/client/core", () => ({
      ApolloClient: vi.fn(function ApolloClient() {}),
      HttpLink: vi.fn(function HttpLink() {}),
      InMemoryCache: vi.fn(function InMemoryCache() {}),
      from: vi.fn(() => ({})),
    }));

    vi.doMock("@apollo/client/link/error", () => ({
      onError: vi.fn((cb: typeof capturedOnError) => {
        capturedOnError = cb;
        return {};
      }),
    }));

    vi.doMock("@apollo/client/react", () => ({
      ApolloProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));

    vi.doMock("sonner", () => ({
      toast: {
        error: toastError,
      },
    }));

    vi.doMock("@/lib/error-message", () => ({
      extractErrorMessage: vi.fn(() => "mutation failed"),
    }));

    await import("@/components/providers/apollo-provider");

    capturedOnError?.({
      operation: { query: { definitions: [{ kind: "OperationDefinition", operation: "mutation" }] } },
      error: new Error("boom"),
    });

    expect(toastError).not.toHaveBeenCalled();
  });
});
