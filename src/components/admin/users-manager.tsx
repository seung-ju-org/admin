"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { IconFileSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { extractErrorMessage } from "@/lib/error-message";
import { toLocaleCode, type Locale, type Messages } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePaginationControls } from "@/components/ui/table-pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const USERS_QUERY = gql`
  query Users(
    $username: String
    $name: String
    $page: Int
    $pageSize: Int
    $sortBy: UserSortField
    $sortOrder: SortOrder
  ) {
    users(
      username: $username
      name: $name
      page: $page
      pageSize: $pageSize
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      totalCount
      items {
        id
        username
        email
        name
        role
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId)
  }
`;

type RoleValue = "ADMIN" | "USER";
type UserRow = {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: RoleValue;
  createdAt: string;
  updatedAt: string;
};
type UsersQueryData = { users: { items: UserRow[]; totalCount: number } };
type UsersQueryVars = {
  username?: string;
  name?: string;
  page: number;
  pageSize: number;
  sortBy?: "CREATED_AT" | "USERNAME" | "NAME" | "EMAIL" | "ROLE";
  sortOrder?: "ASC" | "DESC";
};
type UserMessages = Messages["usersManager"];
type SessionsByUserResponse = {
  sessionsByUserId?: Record<string, number>;
};

type Props = {
  locale: Locale;
  messages: UserMessages;
};

export function UsersManager({ locale, messages }: Props) {
  const [usernameFilter, setUsernameFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [variables, setVariables] = useState<Pick<UsersQueryVars, "username" | "name">>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<NonNullable<UsersQueryVars["sortBy"]>>("CREATED_AT");
  const [sortOrder, setSortOrder] = useState<NonNullable<UsersQueryVars["sortOrder"]>>("DESC");
  const [sessionsByUserId, setSessionsByUserId] = useState<Record<string, number>>({});
  const hasShownSessionLoadErrorToast = useRef(false);
  const queryVariables: UsersQueryVars = {
    ...variables,
    page: pageIndex + 1,
    pageSize,
    sortBy,
    sortOrder,
  };

  const { data, loading, error, refetch } = useQuery<UsersQueryData, UsersQueryVars>(
    USERS_QUERY,
    {
      variables: queryVariables,
      fetchPolicy: "network-only",
    },
  );
  const [deleteUser, { loading: isDeletingUser }] = useMutation(DELETE_USER_MUTATION);
  const users = data?.users.items ?? [];
  const userIdsKey = users.map((user) => user.id).join(",");
  const totalCount = data?.users.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const toggleSort = (nextField: NonNullable<UsersQueryVars["sortBy"]>) => {
    if (sortBy === nextField) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(nextField);
      setSortOrder(nextField === "CREATED_AT" ? "DESC" : "ASC");
    }
    setPageIndex(0);
  };

  const sortMark = (field: NonNullable<UsersQueryVars["sortBy"]>) =>
    sortBy === field ? (sortOrder === "ASC" ? " ↑" : " ↓") : "";

  useEffect(() => {
    const userIds = userIdsKey ? userIdsKey.split(",").filter(Boolean) : [];

    if (userIds.length === 0) {
      setSessionsByUserId({});
      return;
    }

    const controller = new AbortController();

    const loadSessions = async () => {
      try {
        const response = await fetch(
          `/api/admin/sessions?userIds=${encodeURIComponent(userIds.join(","))}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch active sessions");
        }

        const payload = (await response.json()) as SessionsByUserResponse;
        setSessionsByUserId(payload.sessionsByUserId ?? {});
        hasShownSessionLoadErrorToast.current = false;
      } catch {
        if (!controller.signal.aborted) {
          setSessionsByUserId({});
          if (!hasShownSessionLoadErrorToast.current) {
            toast.error(messages.sessionLoadError);
            hasShownSessionLoadErrorToast.current = true;
          }
        }
      }
    };

    void loadSessions();

    return () => controller.abort();
  }, [messages.sessionLoadError, userIdsKey]);

  const applyFilter = async () => {
    const nextVariables = {
      username: usernameFilter.trim() || undefined,
      name: nameFilter.trim() || undefined,
    };

    setVariables(nextVariables);
    setPageIndex(0);
    await refetch({
      ...nextVariables,
      page: 1,
      pageSize,
      sortBy,
      sortOrder,
    });
  };

  const resetFilter = async () => {
    setUsernameFilter("");
    setNameFilter("");

    const emptyVariables = {};
    setVariables(emptyVariables);
    setPageIndex(0);
    await refetch({
      ...emptyVariables,
      page: 1,
      pageSize,
      sortBy,
      sortOrder,
    });
  };

  const removeUser = async (userId: string) => {
    try {
      await deleteUser({
        variables: {
          userId,
        },
      });

      toast.success(messages.deleteSuccess);
      await refetch(queryVariables);
    } catch (error) {
      toast.error(extractErrorMessage(error) ?? messages.deleteError);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{messages.usersList}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void applyFilter();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="users-filter-username">{messages.username}</Label>
                <Input
                  id="users-filter-username"
                  onChange={(event) => setUsernameFilter(event.target.value)}
                  placeholder={messages.usernameFilterPlaceholder}
                  value={usernameFilter}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="users-filter-name">{messages.name}</Label>
                <Input
                  id="users-filter-name"
                  onChange={(event) => setNameFilter(event.target.value)}
                  placeholder={messages.nameFilterPlaceholder}
                  value={nameFilter}
                />
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:justify-end">
              <Button className="w-full sm:w-auto" type="submit" variant="outline">
                {messages.applyFilter}
              </Button>
              <Button className="w-full sm:w-auto" onClick={resetFilter} type="button" variant="ghost">
                {messages.resetFilter}
              </Button>
            </div>
            <Separator />
          </form>

          {error ? <p className="text-sm text-destructive">{messages.loadError}</p> : null}

          <div className="flex justify-end">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/admin/users/create">{messages.create}</Link>
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => toggleSort("USERNAME")} type="button">
                    {messages.username}
                    {sortMark("USERNAME")}
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <button onClick={() => toggleSort("EMAIL")} type="button">
                    {messages.email}
                    {sortMark("EMAIL")}
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell w-px whitespace-nowrap text-center">
                  <button onClick={() => toggleSort("NAME")} type="button">
                    {messages.name}
                    {sortMark("NAME")}
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell w-px whitespace-nowrap text-center">
                  <button onClick={() => toggleSort("ROLE")} type="button">
                    {messages.role}
                    {sortMark("ROLE")}
                  </button>
                </TableHead>
                <TableHead className="w-px whitespace-nowrap text-center">{messages.loginStatus}</TableHead>
                <TableHead className="hidden xl:table-cell w-px whitespace-nowrap text-center">
                  <button onClick={() => toggleSort("CREATED_AT")} type="button">
                    {messages.createdAt}
                    {sortMark("CREATED_AT")}
                  </button>
                </TableHead>
                <TableHead className="hidden 2xl:table-cell w-px whitespace-nowrap text-center">{messages.updatedAt}</TableHead>
                <TableHead className="w-px whitespace-nowrap text-center">{messages.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: pageSize }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell className="hidden md:table-cell w-px whitespace-nowrap text-center"><Skeleton className="mx-auto h-4 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell w-px whitespace-nowrap text-center"><Skeleton className="mx-auto h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="w-px whitespace-nowrap text-center"><Skeleton className="mx-auto h-5 w-20 rounded-full" /></TableCell>
                      <TableCell className="hidden xl:table-cell w-px whitespace-nowrap text-center"><Skeleton className="mx-auto h-4 w-32" /></TableCell>
                      <TableCell className="hidden 2xl:table-cell w-px whitespace-nowrap text-center"><Skeleton className="mx-auto h-4 w-32" /></TableCell>
                      <TableCell className="w-px whitespace-nowrap text-center">
                        <div className="flex flex-nowrap justify-center gap-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : users.map((user) => {
                    const activeSessionCount = sessionsByUserId[user.id] ?? 0;
                    const hasActiveSession = activeSessionCount > 0;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell className="hidden sm:table-cell">{user.email ?? "-"}</TableCell>
                        <TableCell className="hidden md:table-cell w-px whitespace-nowrap text-center">{user.name ?? "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell w-px whitespace-nowrap text-center">
                          <Badge className="mx-auto" variant={user.role === "ADMIN" ? "default" : "secondary"}>
                            {user.role === "ADMIN" ? messages.roleAdmin : messages.roleUser}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-px whitespace-nowrap text-center">
                          <Badge className="mx-auto" variant={hasActiveSession ? "default" : "secondary"}>
                            {hasActiveSession
                              ? `${messages.online} (${activeSessionCount})`
                              : messages.offline}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell w-px whitespace-nowrap text-center">
                          {new Date(user.createdAt).toLocaleString(toLocaleCode(locale))}
                        </TableCell>
                        <TableCell className="hidden 2xl:table-cell w-px whitespace-nowrap text-center">
                          {new Date(user.updatedAt).toLocaleString(toLocaleCode(locale))}
                        </TableCell>
                        <TableCell className="w-px whitespace-nowrap text-center">
                          <div className="flex flex-nowrap justify-center gap-2">
                            <Button asChild size="sm" variant="secondary">
                              <Link href={`/admin/users/${user.id}`}>{messages.details}</Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/admin/users/${user.id}/edit`}>{messages.edit}</Link>
                            </Button>
                            <ConfirmActionButton
                              cancelLabel={messages.cancel}
                              confirmLabel={messages.delete}
                              description={messages.deleteConfirmFinal}
                              disabled={isDeletingUser}
                              onConfirm={() => removeUser(user.id)}
                              size="sm"
                              title={messages.deleteConfirm}
                              triggerLabel={messages.delete}
                              variant="destructive"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              {!loading && !error && users.length === 0 ? (
                <TableRow>
                  <TableCell className="h-40 text-center text-muted-foreground" colSpan={8}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IconFileSearch className="size-9" />
                      <span>{messages.emptyUsers}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          {!loading ? (
            <TablePaginationControls
              onPageIndexChange={setPageIndex}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPageIndex(0);
                void refetch({
                  ...variables,
                  page: 1,
                  pageSize: nextPageSize,
                  sortBy,
                  sortOrder,
                });
              }}
              pageIndex={safePageIndex}
              pageSize={pageSize}
              totalCount={totalCount}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
