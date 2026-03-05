"use client";

import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client/core";
import { onError } from "@apollo/client/link/error";
import { ApolloProvider } from "@apollo/client/react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/error-message";

let lastToastMessage = "";
let lastToastAt = 0;

function pushQueryErrorToast(message: string) {
  const now = Date.now();
  if (message === lastToastMessage && now - lastToastAt < 2000) {
    return;
  }
  lastToastMessage = message;
  lastToastAt = now;
  toast.error(message);
}

const errorLink = onError(({ operation, error }) => {
  const operationType = operation.query.definitions.find(
    (definition) => definition.kind === "OperationDefinition",
  );

  if (
    operationType &&
    "operation" in operationType &&
    operationType.operation === "mutation"
  ) {
    return;
  }

  const message = extractErrorMessage(error);
  if (message) {
    pushQueryErrorToast(message);
    return;
  }

  pushQueryErrorToast("요청 처리 중 오류가 발생했습니다.");
});

const client = new ApolloClient({
  link: from([
    errorLink,
    new HttpLink({
      uri: "/api/graphql",
      credentials: "same-origin",
    }),
  ]),
  cache: new InMemoryCache(),
});

export function GraphqlProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
