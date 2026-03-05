import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

describe("ui primitives", () => {
  it("renders Badge with variant data attribute", () => {
    render(<Badge variant="destructive">Delete</Badge>);

    const badge = screen.getByText("Delete");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge).toHaveAttribute("data-variant", "destructive");
  });

  it("renders Card composition", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByText("Content")).toHaveAttribute("data-slot", "card-content");
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "card-footer");
  });

  it("renders Input and Label", () => {
    render(
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" placeholder="enter" />
      </div>,
    );

    expect(screen.getByText("Username")).toHaveAttribute("data-slot", "label");
    expect(screen.getByPlaceholderText("enter")).toHaveAttribute("data-slot", "input");
  });

  it("renders Skeleton", () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId("skeleton")).toHaveAttribute("data-slot", "skeleton");
  });

  it("renders Table composition", () => {
    render(
      <Table>
        <TableCaption>Rows</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Admin</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByText("Rows")).toHaveAttribute("data-slot", "table-caption");
    expect(screen.getByText("Name")).toHaveAttribute("data-slot", "table-head");
    expect(screen.getByText("Admin")).toHaveAttribute("data-slot", "table-cell");
  });
});
