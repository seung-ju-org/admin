"use client";

import { useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePaginationControls } from "@/components/ui/table-pagination-controls";
import { toLocaleCode, type Locale, type Messages } from "@/lib/i18n";

type RecentUser = {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: "ADMIN" | "USER";
  createdAt: string;
};

type Props = {
  locale: Locale;
  messages: Messages["usersManager"];
  users: RecentUser[];
  emptyLabel: string;
};

export function RecentUsersTable({ locale, messages, users, emptyLabel }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<"USERNAME" | "EMAIL" | "NAME" | "ROLE" | "CREATED_AT">(
    "CREATED_AT",
  );
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const localeCode = toLocaleCode(locale);
  const sortedUsers = useMemo(() => {
    const sorted = [...users];

    sorted.sort((a, b) => {
      const direction = sortOrder === "ASC" ? 1 : -1;

      if (sortBy === "USERNAME") return a.username.localeCompare(b.username) * direction;
      if (sortBy === "EMAIL") return (a.email ?? "").localeCompare(b.email ?? "") * direction;
      if (sortBy === "NAME") return (a.name ?? "").localeCompare(b.name ?? "") * direction;
      if (sortBy === "ROLE") return a.role.localeCompare(b.role) * direction;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    });

    return sorted;
  }, [sortBy, sortOrder, users]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const toggleSort = (nextField: "USERNAME" | "EMAIL" | "NAME" | "ROLE" | "CREATED_AT") => {
    if (sortBy === nextField) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(nextField);
      setSortOrder(nextField === "CREATED_AT" ? "DESC" : "ASC");
    }
    setPageIndex(0);
  };
  const sortMark = (field: "USERNAME" | "EMAIL" | "NAME" | "ROLE" | "CREATED_AT") =>
    sortBy === field ? (sortOrder === "ASC" ? " ↑" : " ↓") : "";

  const pagedUsers = useMemo(() => {
    const start = safePageIndex * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [pageSize, safePageIndex, sortedUsers]);

  return (
    <div className="space-y-3">
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
            <TableHead className="hidden md:table-cell">
              <button onClick={() => toggleSort("NAME")} type="button">
                {messages.name}
                {sortMark("NAME")}
              </button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <button onClick={() => toggleSort("ROLE")} type="button">
                {messages.role}
                {sortMark("ROLE")}
              </button>
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              <button onClick={() => toggleSort("CREATED_AT")} type="button">
                {messages.createdAt}
                {sortMark("CREATED_AT")}
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell className="hidden sm:table-cell">{user.email ?? "-"}</TableCell>
              <TableCell className="hidden md:table-cell">{user.name ?? "-"}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {user.role === "ADMIN" ? messages.roleAdmin : messages.roleUser}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {new Date(user.createdAt).toLocaleString(localeCode)}
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 ? (
            <TableRow>
              <TableCell className="h-24 text-center text-muted-foreground" colSpan={5}>
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <TablePaginationControls
        onPageIndexChange={setPageIndex}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPageIndex(0);
        }}
        pageIndex={safePageIndex}
        pageSize={pageSize}
        totalCount={sortedUsers.length}
      />
    </div>
  );
}
