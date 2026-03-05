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

type MonitoringAlert = {
  name: string;
  severity: string;
  instance: string;
  value: number;
};

type Props = {
  alerts: MonitoringAlert[];
  emptyLabel: string;
  labels: {
    alert: string;
    severity: string;
    instance: string;
    value: string;
  };
};

export function MonitoringAlertsTable({ alerts, emptyLabel, labels }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<"ALERT" | "SEVERITY" | "INSTANCE" | "VALUE">("VALUE");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const sortedAlerts = useMemo(() => {
    const sorted = [...alerts];
    const direction = sortOrder === "ASC" ? 1 : -1;

    sorted.sort((a, b) => {
      if (sortBy === "ALERT") return a.name.localeCompare(b.name) * direction;
      if (sortBy === "SEVERITY") return a.severity.localeCompare(b.severity) * direction;
      if (sortBy === "INSTANCE") return a.instance.localeCompare(b.instance) * direction;
      return (a.value - b.value) * direction;
    });

    return sorted;
  }, [alerts, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedAlerts.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const toggleSort = (nextField: "ALERT" | "SEVERITY" | "INSTANCE" | "VALUE") => {
    if (sortBy === nextField) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(nextField);
      setSortOrder(nextField === "VALUE" ? "DESC" : "ASC");
    }
    setPageIndex(0);
  };
  const sortMark = (field: "ALERT" | "SEVERITY" | "INSTANCE" | "VALUE") =>
    sortBy === field ? (sortOrder === "ASC" ? " ↑" : " ↓") : "";

  const pagedAlerts = useMemo(() => {
    const start = safePageIndex * pageSize;
    return sortedAlerts.slice(start, start + pageSize);
  }, [pageSize, safePageIndex, sortedAlerts]);

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button onClick={() => toggleSort("ALERT")} type="button">
                {labels.alert}
                {sortMark("ALERT")}
              </button>
            </TableHead>
            <TableHead>
              <button onClick={() => toggleSort("SEVERITY")} type="button">
                {labels.severity}
                {sortMark("SEVERITY")}
              </button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <button onClick={() => toggleSort("INSTANCE")} type="button">
                {labels.instance}
                {sortMark("INSTANCE")}
              </button>
            </TableHead>
            <TableHead>
              <button onClick={() => toggleSort("VALUE")} type="button">
                {labels.value}
                {sortMark("VALUE")}
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedAlerts.map((alert, index) => (
            <TableRow key={`${alert.name}-${alert.instance}-${index}`}>
              <TableCell>{alert.name}</TableCell>
              <TableCell>{alert.severity}</TableCell>
              <TableCell className="hidden md:table-cell">{alert.instance}</TableCell>
              <TableCell>{alert.value.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          {alerts.length === 0 ? (
            <TableRow>
              <TableCell className="h-24 text-center text-muted-foreground" colSpan={4}>
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
        totalCount={sortedAlerts.length}
      />
    </div>
  );
}
