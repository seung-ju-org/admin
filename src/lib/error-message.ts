export function extractErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const maybeError = error as {
    message?: string;
    graphQLErrors?: Array<{ message?: string }>;
    networkError?: {
      result?: {
        errors?: Array<{ message?: string }>;
      };
    };
  };

  const graphQlMessage = maybeError.graphQLErrors?.[0]?.message;
  if (graphQlMessage?.trim()) {
    return graphQlMessage;
  }

  const networkMessage = maybeError.networkError?.result?.errors?.[0]?.message;
  if (networkMessage?.trim()) {
    return networkMessage;
  }

  if (maybeError.message?.trim()) {
    return maybeError.message;
  }

  return null;
}

export async function extractResponseMessage(response: Response): Promise<string | null> {
  try {
    const payload = (await response.json()) as { message?: unknown; error?: unknown };

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }

    return null;
  } catch {
    return null;
  }
}
