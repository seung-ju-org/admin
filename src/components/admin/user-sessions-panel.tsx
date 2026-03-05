"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import { extractErrorMessage, extractResponseMessage } from "@/lib/error-message";
import { toLocaleCode, type Locale, type Messages } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const USER_QUERY = gql`
  query User($userId: ID!) {
    user(userId: $userId) {
      id
      username
      email
      name
      role
    }
  }
`;

type Props = {
  userId: string;
  locale: Locale;
  messages: Messages["usersManager"];
  currentSessionId?: string;
};

type UserQueryData = {
  user: {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
    role: "ADMIN" | "USER";
  } | null;
};

type SessionItem = {
  sessionId: string;
  issuedAt: number;
  lastSeenAt: number;
  lastIp: string | null;
  userAgent: string | null;
  expiresAt: number | null;
};

type UserSessionsResponse = {
  sessions?: SessionItem[];
};

function formatDate(locale: Locale, value: number) {
  return new Date(value).toLocaleString(toLocaleCode(locale));
}

export function UserSessionsPanel({ userId, locale, messages, currentSessionId }: Props) {
  const { data, loading, error } = useQuery<UserQueryData>(USER_QUERY, {
    variables: { userId },
    fetchPolicy: "network-only",
  });
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [processingSessionId, setProcessingSessionId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const hasShownSessionLoadErrorToast = useRef(false);
  const [sortBy, setSortBy] = useState<"SESSION_ID" | "LAST_IP" | "USER_AGENT" | "ISSUED_AT" | "LAST_SEEN_AT">(
    "LAST_SEEN_AT",
  );
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const sortedSessions = useMemo(() => {
    const sorted = [...sessions];
    const direction = sortOrder === "ASC" ? 1 : -1;

    sorted.sort((a, b) => {
      if (sortBy === "SESSION_ID") return a.sessionId.localeCompare(b.sessionId) * direction;
      if (sortBy === "LAST_IP") return (a.lastIp ?? "").localeCompare(b.lastIp ?? "") * direction;
      if (sortBy === "USER_AGENT") return (a.userAgent ?? "").localeCompare(b.userAgent ?? "") * direction;
      if (sortBy === "ISSUED_AT") return (a.issuedAt - b.issuedAt) * direction;
      return (a.lastSeenAt - b.lastSeenAt) * direction;
    });

    return sorted;
  }, [sessions, sortBy, sortOrder]);

  const hasSessions = sessions.length > 0;
  const sessionCountLabel = useMemo(() => `${messages.sessions} (${sessions.length})`, [messages.sessions, sessions.length]);
  const toggleSort = (nextField: "SESSION_ID" | "LAST_IP" | "USER_AGENT" | "ISSUED_AT" | "LAST_SEEN_AT") => {
    if (sortBy === nextField) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(nextField);
      setSortOrder(nextField === "ISSUED_AT" || nextField === "LAST_SEEN_AT" ? "DESC" : "ASC");
    }
  };
  const sortMark = (field: "SESSION_ID" | "LAST_IP" | "USER_AGENT" | "ISSUED_AT" | "LAST_SEEN_AT") =>
    sortBy === field ? (sortOrder === "ASC" ? " ↑" : " ↓") : "";

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setSessionError(null);

    try {
      const response = await fetch(`/api/admin/sessions?userId=${encodeURIComponent(userId)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error((await extractResponseMessage(response)) ?? messages.sessionLoadError);
      }

      const payload = (await response.json()) as UserSessionsResponse;
      setSessions(Array.isArray(payload.sessions) ? payload.sessions : []);
      hasShownSessionLoadErrorToast.current = false;
    } catch (error) {
      const message = extractErrorMessage(error) ?? messages.sessionLoadError;
      setSessionError(message);
      if (!hasShownSessionLoadErrorToast.current) {
        toast.error(message);
        hasShownSessionLoadErrorToast.current = true;
      }
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [messages.sessionLoadError, userId]);

  const revokeSession = async (sessionId: string) => {
    setProcessingSessionId(sessionId);
    try {
      const response = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, sessionId }),
      });

      if (!response.ok) {
        throw new Error((await extractResponseMessage(response)) ?? messages.forceLogoutError);
      }

      setSessions((prev) => prev.filter((item) => item.sessionId !== sessionId));
      toast.success(messages.revokeSessionSuccess);
      if (currentSessionId && sessionId === currentSessionId) {
        await signOut({ callbackUrl: "/login" });
        return;
      }
    } catch (error) {
      const message = extractErrorMessage(error) ?? messages.forceLogoutError;
      setSessionError(message);
      toast.error(message);
    } finally {
      setProcessingSessionId(null);
    }
  };

  const revokeAllSessions = async () => {
    setIsRevokingAll(true);
    try {
      const response = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error((await extractResponseMessage(response)) ?? messages.forceLogoutError);
      }

      setSessions([]);
      toast.success(messages.revokeAllSessionsSuccess);
    } catch (error) {
      const message = extractErrorMessage(error) ?? messages.forceLogoutError;
      setSessionError(message);
      toast.error(message);
    } finally {
      setIsRevokingAll(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{messages.details}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{messages.details}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{messages.loadError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{messages.details}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <p className="text-muted-foreground">{messages.username}</p>
            <p className="font-medium">{data.user.username}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{messages.name}</p>
            <p className="font-medium">{data.user.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{messages.email}</p>
            <p className="font-medium">{data.user.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{messages.role}</p>
            <Badge variant={data.user.role === "ADMIN" ? "default" : "secondary"}>
              {data.user.role === "ADMIN" ? messages.roleAdmin : messages.roleUser}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-col gap-2 sm:flex-row sm:items-center">
          <CardTitle>{sessionCountLabel}</CardTitle>
          <div className="flex justify-end sm:ml-auto">
            <ConfirmActionButton
              cancelLabel={messages.cancel}
              confirmLabel={messages.revokeAllSessions}
              description={messages.revokeAllSessionsConfirm}
              disabled={!hasSessions || isRevokingAll || isLoadingSessions}
              onConfirm={revokeAllSessions}
              size="sm"
              title={messages.revokeAllSessions}
              triggerLabel={messages.revokeAllSessions}
              variant="destructive"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionError ? <p className="text-sm text-destructive">{sessionError}</p> : null}
          {isLoadingSessions ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button onClick={() => toggleSort("SESSION_ID")} type="button">
                      {messages.sessionId}
                      {sortMark("SESSION_ID")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort("LAST_IP")} type="button">
                      {messages.sessionLastIp}
                      {sortMark("LAST_IP")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort("USER_AGENT")} type="button">
                      {messages.sessionUserAgent}
                      {sortMark("USER_AGENT")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort("ISSUED_AT")} type="button">
                      {messages.sessionIssuedAt}
                      {sortMark("ISSUED_AT")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort("LAST_SEEN_AT")} type="button">
                      {messages.sessionLastSeenAt}
                      {sortMark("LAST_SEEN_AT")}
                    </button>
                  </TableHead>
                  <TableHead>{messages.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSessions.map((item) => (
                  <TableRow key={item.sessionId}>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span>{item.sessionId}</span>
                        {currentSessionId && item.sessionId === currentSessionId ? (
                          <Badge variant="default">Current</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{item.lastIp ?? messages.sessionNoIp}</TableCell>
                    <TableCell className="max-w-[280px] truncate">
                      {item.userAgent ?? messages.sessionNoUserAgent}
                    </TableCell>
                    <TableCell>{formatDate(locale, item.issuedAt)}</TableCell>
                    <TableCell>{formatDate(locale, item.lastSeenAt)}</TableCell>
                    <TableCell className="text-right">
                      <ConfirmActionButton
                        cancelLabel={messages.cancel}
                        confirmLabel={messages.revokeSession}
                        description={messages.revokeSessionConfirm}
                        disabled={processingSessionId === item.sessionId || isRevokingAll}
                        onConfirm={() => revokeSession(item.sessionId)}
                        size="sm"
                        title={messages.revokeSession}
                        triggerLabel={messages.revokeSession}
                        variant="outline"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-20 text-center text-muted-foreground" colSpan={6}>
                      {messages.sessionEmpty}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
