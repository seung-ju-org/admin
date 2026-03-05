"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { IconFileSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { extractErrorMessage } from "@/lib/error-message";
import { toLocaleCode, type Locale, type Messages } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePaginationControls } from "@/components/ui/table-pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CAREERS_QUERY = gql`
  query Careers(
    $company: String
    $position: String
    $isCurrent: Boolean
    $isPublished: Boolean
    $locale: ProjectLocale
    $page: Int
    $pageSize: Int
    $sortBy: CareerSortField
    $sortOrder: SortOrder
  ) {
    careers(
      company: $company
      position: $position
      isCurrent: $isCurrent
      isPublished: $isPublished
      locale: $locale
      page: $page
      pageSize: $pageSize
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      totalCount
      items {
        id
        company
        position
        description
        startDate
        endDate
        isCurrent
        displayOrder
        isPublished
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_CAREER_MUTATION = gql`
  mutation DeleteCareer($careerId: ID!) {
    deleteCareer(careerId: $careerId)
  }
`;

type CareerRow = {
  id: string;
  company: string;
  position: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type CareersQueryData = {
  careers: {
    totalCount: number;
    items: CareerRow[];
  };
};

type CareersQueryVars = {
  company?: string;
  position?: string;
  isCurrent?: boolean;
  isPublished?: boolean;
  locale?: "KO" | "EN" | "JA";
  page?: number;
  pageSize?: number;
  sortBy?:
    | "CREATED_AT"
    | "COMPANY"
    | "POSITION"
    | "DISPLAY_ORDER"
    | "START_DATE"
    | "END_DATE"
    | "IS_CURRENT"
    | "IS_PUBLISHED";
  sortOrder?: "ASC" | "DESC";
};

type Props = {
  locale: Locale;
  messages: Messages["careersManager"];
};

export function CareersManager({ locale, messages }: Props) {
  const [companyFilter, setCompanyFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [currentFilter, setCurrentFilter] = useState<"ALL" | "CURRENT" | "NOT_CURRENT">("ALL");
  const [publishedFilter, setPublishedFilter] = useState<"ALL" | "PUBLISHED" | "UNPUBLISHED">(
    "ALL",
  );
  const [filters, setFilters] = useState<
    Pick<CareersQueryVars, "company" | "position" | "isCurrent" | "isPublished">
  >({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<NonNullable<CareersQueryVars["sortBy"]>>("DISPLAY_ORDER");
  const [sortOrder, setSortOrder] = useState<NonNullable<CareersQueryVars["sortOrder"]>>("ASC");
  const localeInput = locale === "ja" ? "JA" : locale === "en" ? "EN" : "KO";

  const queryVariables: CareersQueryVars = {
    ...filters,
    locale: localeInput,
    page: pageIndex + 1,
    pageSize,
    sortBy,
    sortOrder,
  };

  const { data, loading, error, refetch } = useQuery<CareersQueryData, CareersQueryVars>(
    CAREERS_QUERY,
    {
      variables: queryVariables,
      fetchPolicy: "network-only",
    },
  );

  const [deleteCareer, { loading: isDeleting }] = useMutation(DELETE_CAREER_MUTATION);
  const careers = data?.careers.items ?? [];
  const totalCount = data?.careers.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const localeCode = toLocaleCode(locale);

  const toggleSort = (nextField: NonNullable<CareersQueryVars["sortBy"]>) => {
    if (sortBy === nextField) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(nextField);
      setSortOrder(nextField === "CREATED_AT" ? "DESC" : "ASC");
    }
    setPageIndex(0);
  };

  const sortMark = (field: NonNullable<CareersQueryVars["sortBy"]>) =>
    sortBy === field ? (sortOrder === "ASC" ? " ↑" : " ↓") : "";

  const applyFilter = async () => {
    const nextFilters: CareersQueryVars = {
      company: companyFilter.trim() || undefined,
      position: positionFilter.trim() || undefined,
      isCurrent: currentFilter === "ALL" ? undefined : currentFilter === "CURRENT",
      isPublished:
        publishedFilter === "ALL" ? undefined : publishedFilter === "PUBLISHED" ? true : false,
    };

    setFilters(nextFilters);
    setPageIndex(0);
    await refetch({
      ...nextFilters,
      locale: localeInput,
      page: 1,
      pageSize,
      sortBy,
      sortOrder,
    });
  };

  const resetFilter = async () => {
    setCompanyFilter("");
    setPositionFilter("");
    setCurrentFilter("ALL");
    setPublishedFilter("ALL");

    const nextFilters = {};
    setFilters(nextFilters);
    setPageIndex(0);
    await refetch({
      locale: localeInput,
      page: 1,
      pageSize,
      sortBy,
      sortOrder,
    });
  };

  const removeCareer = async (careerId: string) => {
    try {
      await deleteCareer({ variables: { careerId } });
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
          <CardTitle>{messages.careersList}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void applyFilter();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="careers-filter-company">{messages.company}</Label>
                <Input
                  id="careers-filter-company"
                  onChange={(event) => setCompanyFilter(event.target.value)}
                  placeholder={messages.companyFilterPlaceholder}
                  value={companyFilter}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="careers-filter-position">{messages.position}</Label>
                <Input
                  id="careers-filter-position"
                  onChange={(event) => setPositionFilter(event.target.value)}
                  placeholder={messages.positionFilterPlaceholder}
                  value={positionFilter}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="careers-filter-current">{messages.isCurrent}</Label>
                <Select
                  onValueChange={(value) => setCurrentFilter(value as "ALL" | "CURRENT" | "NOT_CURRENT")}
                  value={currentFilter}
                >
                  <SelectTrigger className="w-full" id="careers-filter-current">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{messages.allStatus}</SelectItem>
                    <SelectItem value="CURRENT">{messages.currentOnly}</SelectItem>
                    <SelectItem value="NOT_CURRENT">{messages.notCurrentOnly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="careers-filter-published">{messages.isPublished}</Label>
                <Select
                  onValueChange={(value) =>
                    setPublishedFilter(value as "ALL" | "PUBLISHED" | "UNPUBLISHED")
                  }
                  value={publishedFilter}
                >
                  <SelectTrigger className="w-full" id="careers-filter-published">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{messages.allStatus}</SelectItem>
                    <SelectItem value="PUBLISHED">{messages.publishedOnly}</SelectItem>
                    <SelectItem value="UNPUBLISHED">{messages.unpublishedOnly}</SelectItem>
                  </SelectContent>
                </Select>
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

          {error ? (
            <p className="text-sm text-destructive">
              {messages.loadError} ({error.message})
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/admin/careers/create">{messages.create}</Link>
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => toggleSort("COMPANY")} type="button">
                    {messages.company}
                    {sortMark("COMPANY")}
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <button onClick={() => toggleSort("POSITION")} type="button">
                    {messages.position}
                    {sortMark("POSITION")}
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">{messages.description}</TableHead>
                <TableHead className="hidden w-px whitespace-nowrap text-center lg:table-cell">
                  <button className="inline-flex items-center justify-center gap-1" onClick={() => toggleSort("START_DATE")} type="button">
                    {messages.startDate}
                    {sortMark("START_DATE")}
                  </button>
                </TableHead>
                <TableHead className="hidden w-px whitespace-nowrap text-center lg:table-cell">
                  <button className="inline-flex items-center justify-center gap-1" onClick={() => toggleSort("END_DATE")} type="button">
                    {messages.endDate}
                    {sortMark("END_DATE")}
                  </button>
                </TableHead>
                <TableHead className="hidden w-px whitespace-nowrap text-center md:table-cell">
                  <button className="inline-flex items-center justify-center gap-1" onClick={() => toggleSort("DISPLAY_ORDER")} type="button">
                    {messages.displayOrder}
                    {sortMark("DISPLAY_ORDER")}
                  </button>
                </TableHead>
                <TableHead className="w-px whitespace-nowrap text-center">
                  <button className="inline-flex items-center justify-center gap-1" onClick={() => toggleSort("IS_CURRENT")} type="button">
                    {messages.isCurrent}
                    {sortMark("IS_CURRENT")}
                  </button>
                </TableHead>
                <TableHead className="w-px whitespace-nowrap text-center">
                  <button className="inline-flex items-center justify-center gap-1" onClick={() => toggleSort("IS_PUBLISHED")} type="button">
                    {messages.isPublished}
                    {sortMark("IS_PUBLISHED")}
                  </button>
                </TableHead>
                <TableHead className="hidden xl:table-cell whitespace-nowrap text-center">{messages.createdAt}</TableHead>
                <TableHead className="hidden 2xl:table-cell whitespace-nowrap text-center">{messages.updatedAt}</TableHead>
                <TableHead className="w-px whitespace-nowrap text-center">{messages.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: pageSize }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="hidden w-px whitespace-nowrap text-center lg:table-cell"><Skeleton className="mx-auto h-4 w-24" /></TableCell>
                      <TableCell className="hidden w-px whitespace-nowrap text-center lg:table-cell"><Skeleton className="mx-auto h-4 w-24" /></TableCell>
                      <TableCell className="hidden w-px whitespace-nowrap text-center md:table-cell"><Skeleton className="mx-auto h-4 w-12" /></TableCell>
                      <TableCell className="w-px whitespace-nowrap text-center"><Skeleton className="mx-auto h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="w-px whitespace-nowrap text-center"><Skeleton className="mx-auto h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="hidden xl:table-cell whitespace-nowrap text-center"><Skeleton className="mx-auto h-4 w-24" /></TableCell>
                      <TableCell className="hidden 2xl:table-cell whitespace-nowrap text-center"><Skeleton className="mx-auto h-4 w-24" /></TableCell>
                      <TableCell className="w-px whitespace-nowrap text-center">
                        <div className="flex flex-nowrap justify-center gap-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : careers.map((career) => (
                    <TableRow key={career.id}>
                      <TableCell>{career.company}</TableCell>
                      <TableCell className="hidden sm:table-cell">{career.position}</TableCell>
                      <TableCell className="hidden max-w-[320px] truncate md:table-cell">
                        {career.description || "-"}
                      </TableCell>
                      <TableCell className="hidden w-px whitespace-nowrap text-center lg:table-cell">
                        {new Date(career.startDate).toLocaleDateString(localeCode)}
                      </TableCell>
                      <TableCell className="hidden w-px whitespace-nowrap text-center lg:table-cell">
                        {career.endDate ? new Date(career.endDate).toLocaleDateString(localeCode) : "-"}
                      </TableCell>
                      <TableCell className="hidden w-px whitespace-nowrap text-center md:table-cell">{career.displayOrder}</TableCell>
                      <TableCell className="w-px whitespace-nowrap text-center">
                        <Badge className="mx-auto" variant={career.isCurrent ? "default" : "secondary"}>
                          {career.isCurrent ? messages.currentOnly : messages.notCurrentOnly}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-px whitespace-nowrap text-center">
                        <Badge className="mx-auto" variant={career.isPublished ? "default" : "secondary"}>
                          {career.isPublished ? messages.publishedOnly : messages.unpublishedOnly}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell whitespace-nowrap text-center">
                        {new Date(career.createdAt).toLocaleDateString(localeCode)}
                      </TableCell>
                      <TableCell className="hidden 2xl:table-cell whitespace-nowrap text-center">
                        {new Date(career.updatedAt).toLocaleDateString(localeCode)}
                      </TableCell>
                      <TableCell className="w-px whitespace-nowrap text-center">
                        <div className="flex flex-nowrap justify-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/careers/${career.id}/edit`}>{messages.edit}</Link>
                          </Button>
                          <Button
                            disabled={isDeleting}
                            onClick={() => removeCareer(career.id)}
                            size="sm"
                            variant="destructive"
                          >
                            {messages.delete}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && !error && careers.length === 0 ? (
                <TableRow>
                  <TableCell className="h-40 text-center text-muted-foreground" colSpan={11}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IconFileSearch className="size-9" />
                      <span>{messages.emptyCareers}</span>
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
                  ...filters,
                  locale: localeInput,
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
