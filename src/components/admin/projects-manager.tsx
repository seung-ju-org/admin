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

const PROJECTS_QUERY = gql`
  query Projects(
    $slug: String
    $isPublished: Boolean
    $locale: ProjectLocale
    $page: Int
    $pageSize: Int
    $sortBy: ProjectSortField
    $sortOrder: SortOrder
  ) {
    projects(
      slug: $slug
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
        slug
        title
        company
        role
        technologies
        displayOrder
        startDate
        endDate
        isOngoing
        isPublished
        createdAt
        updatedAt
      }
    }
  }
`;

const DELETE_PROJECT_MUTATION = gql`
  mutation DeleteProject($projectId: ID!) {
    deleteProject(projectId: $projectId)
  }
`;

type ProjectRow = {
  id: string;
  slug: string;
  title: string | null;
  company: string | null;
  role: string | null;
  technologies: string[];
  displayOrder: number;
  startDate: string;
  endDate: string | null;
  isOngoing: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProjectsQueryData = {
  projects: {
    totalCount: number;
    items: ProjectRow[];
  };
};

type ProjectsQueryVars = {
  slug?: string;
  isPublished?: boolean;
  locale?: "EN" | "KO" | "JA";
  page?: number;
  pageSize?: number;
  sortBy?:
    | "CREATED_AT"
    | "SLUG"
    | "DISPLAY_ORDER"
    | "START_DATE"
    | "END_DATE"
    | "IS_PUBLISHED";
  sortOrder?: "ASC" | "DESC";
};

type Props = {
  locale: Locale;
  messages: Messages["projectsManager"];
};

export function ProjectsManager({ locale, messages }: Props) {
  const [slugFilter, setSlugFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"ALL" | "PUBLISHED" | "UNPUBLISHED">(
    "ALL",
  );
  const [filters, setFilters] = useState<Pick<ProjectsQueryVars, "slug" | "isPublished">>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<NonNullable<ProjectsQueryVars["sortBy"]>>("DISPLAY_ORDER");
  const [sortOrder, setSortOrder] = useState<NonNullable<ProjectsQueryVars["sortOrder"]>>("ASC");
  const queryVariables: ProjectsQueryVars = {
    ...filters,
    locale: locale.toUpperCase() as "EN" | "KO" | "JA",
    page: pageIndex + 1,
    pageSize,
    sortBy,
    sortOrder,
  };

  const { data, loading, error, refetch } = useQuery<ProjectsQueryData, ProjectsQueryVars>(
    PROJECTS_QUERY,
    {
      variables: queryVariables,
      fetchPolicy: "network-only",
    },
  );

  const [deleteProject, { loading: isDeleting }] = useMutation(DELETE_PROJECT_MUTATION);
  const projects = data?.projects.items ?? [];
  const totalCount = data?.projects.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const toggleSort = (nextField: NonNullable<ProjectsQueryVars["sortBy"]>) => {
    if (sortBy === nextField) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(nextField);
      setSortOrder(nextField === "CREATED_AT" ? "DESC" : "ASC");
    }
    setPageIndex(0);
  };

  const sortMark = (field: NonNullable<ProjectsQueryVars["sortBy"]>) =>
    sortBy === field ? (sortOrder === "ASC" ? " ↑" : " ↓") : "";

  const localeCode = toLocaleCode(locale);

  const applyFilter = async () => {
    const nextVariables: ProjectsQueryVars = {
      slug: slugFilter.trim() || undefined,
      isPublished:
        publishedFilter === "ALL" ? undefined : publishedFilter === "PUBLISHED" ? true : false,
    };

    setFilters(nextVariables);
    setPageIndex(0);
    await refetch({
      ...nextVariables,
      locale: locale.toUpperCase() as "EN" | "KO" | "JA",
      page: 1,
      pageSize,
      sortBy,
      sortOrder,
    });
  };

  const resetFilter = async () => {
    setSlugFilter("");
    setPublishedFilter("ALL");

    const nextVariables = {};
    setFilters(nextVariables);
    setPageIndex(0);
    await refetch({
      locale: locale.toUpperCase() as "EN" | "KO" | "JA",
      page: 1,
      pageSize,
      sortBy,
      sortOrder,
    });
  };

  const removeProject = async (projectId: string) => {
    try {
      await deleteProject({
        variables: { projectId },
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
          <CardTitle>{messages.projectsList}</CardTitle>
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
                <Label htmlFor="projects-filter-slug">{messages.slug}</Label>
                <Input
                  id="projects-filter-slug"
                  onChange={(event) => setSlugFilter(event.target.value)}
                  placeholder={messages.slugPlaceholder}
                  value={slugFilter}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projects-filter-published">{messages.isPublished}</Label>
                <Select
                  onValueChange={(value) =>
                    setPublishedFilter(value as "ALL" | "PUBLISHED" | "UNPUBLISHED")
                  }
                  value={publishedFilter}
                >
                  <SelectTrigger className="w-full" id="projects-filter-published">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{messages.statusAll}</SelectItem>
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
              <Link href="/admin/projects/create">{messages.create}</Link>
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => toggleSort("SLUG")} type="button">
                    {messages.slug}
                    {sortMark("SLUG")}
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">{messages.title}</TableHead>
                <TableHead className="hidden md:table-cell">{messages.company}</TableHead>
                <TableHead className="hidden lg:table-cell">{messages.projectRole}</TableHead>
                <TableHead className="hidden xl:table-cell">{messages.technologies}</TableHead>
                <TableHead className="hidden md:table-cell text-center">
                  <button onClick={() => toggleSort("DISPLAY_ORDER")} type="button">
                    {messages.displayOrder}
                    {sortMark("DISPLAY_ORDER")}
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button onClick={() => toggleSort("IS_PUBLISHED")} type="button">
                    {messages.isPublished}
                    {sortMark("IS_PUBLISHED")}
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell text-center">
                  <button onClick={() => toggleSort("START_DATE")} type="button">
                    {messages.startDate}
                    {sortMark("START_DATE")}
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell text-center">
                  <button onClick={() => toggleSort("END_DATE")} type="button">
                    {messages.endDate}
                    {sortMark("END_DATE")}
                  </button>
                </TableHead>
                <TableHead className="hidden xl:table-cell text-center">
                  <button onClick={() => toggleSort("CREATED_AT")} type="button">
                    {messages.createdAt}
                    {sortMark("CREATED_AT")}
                  </button>
                </TableHead>
                <TableHead className="hidden 2xl:table-cell text-center">{messages.updatedAt}</TableHead>
                <TableHead className="w-px whitespace-nowrap text-center">{messages.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: pageSize }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-44" /></TableCell>
                      <TableCell className="hidden md:table-cell text-center"><Skeleton className="mx-auto h-4 w-12" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="mx-auto h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="hidden lg:table-cell text-center"><Skeleton className="mx-auto h-4 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell text-center"><Skeleton className="mx-auto h-4 w-24" /></TableCell>
                      <TableCell className="hidden xl:table-cell text-center"><Skeleton className="mx-auto h-4 w-24" /></TableCell>
                      <TableCell className="hidden 2xl:table-cell text-center"><Skeleton className="mx-auto h-4 w-24" /></TableCell>
                      <TableCell className="w-px whitespace-nowrap text-center">
                        <div className="flex flex-nowrap justify-center gap-2">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>{project.slug}</TableCell>
                      <TableCell className="hidden sm:table-cell">{project.title ?? "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">{project.company ?? "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{project.role ?? "-"}</TableCell>
                      <TableCell className="hidden max-w-[320px] truncate xl:table-cell">
                        {project.technologies.length > 0 ? project.technologies.join(", ") : "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">{project.displayOrder}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={project.isPublished ? "default" : "secondary"}>
                          {project.isPublished ? messages.statusPublished : messages.statusDraft}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        {new Date(project.startDate).toLocaleDateString(localeCode)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString(localeCode)
                          : "-"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-center">
                        {new Date(project.createdAt).toLocaleDateString(localeCode)}
                      </TableCell>
                      <TableCell className="hidden 2xl:table-cell text-center">
                        {new Date(project.updatedAt).toLocaleDateString(localeCode)}
                      </TableCell>
                      <TableCell className="w-px whitespace-nowrap text-center">
                        <div className="flex flex-nowrap justify-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/projects/${project.id}/edit`}>{messages.edit}</Link>
                          </Button>
                          <Button
                            disabled={isDeleting}
                            onClick={() => removeProject(project.id)}
                            size="sm"
                            variant="destructive"
                          >
                            {messages.delete}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && !error && projects.length === 0 ? (
                <TableRow>
                  <TableCell className="h-40 text-center text-muted-foreground" colSpan={12}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IconFileSearch className="size-9" />
                      <span>{messages.emptyProjects}</span>
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
                  locale: locale.toUpperCase() as "EN" | "KO" | "JA",
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
