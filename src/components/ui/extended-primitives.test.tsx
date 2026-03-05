import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("radix-ui", () => {
  const Wrap = ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => (
    <div {...props}>{children}</div>
  );
  const ButtonLike = ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => (
    <button type="button" {...props}>{children}</button>
  );

  return {
    Slot: { Root: ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => <span {...props}>{children}</span> },
    Avatar: {
      Root: Wrap,
      Image: ({ alt }: { alt?: string }) => <img alt={alt} />,
      Fallback: Wrap,
    },
    Select: {
      Root: Wrap,
      Group: Wrap,
      Value: Wrap,
      Trigger: ButtonLike,
      Icon: Wrap,
      Portal: Wrap,
      Content: Wrap,
      Viewport: Wrap,
      Label: Wrap,
      Item: ButtonLike,
      ItemIndicator: Wrap,
      ItemText: Wrap,
      Separator: Wrap,
      ScrollUpButton: ButtonLike,
      ScrollDownButton: ButtonLike,
    },
    DropdownMenu: {
      Root: Wrap,
      Portal: Wrap,
      Trigger: ButtonLike,
      Content: Wrap,
      Group: Wrap,
      Item: ButtonLike,
      CheckboxItem: ButtonLike,
      RadioGroup: Wrap,
      RadioItem: ButtonLike,
      ItemIndicator: Wrap,
      Label: Wrap,
      Separator: Wrap,
      Sub: Wrap,
      SubTrigger: ButtonLike,
      SubContent: Wrap,
    },
    Checkbox: {
      Root: ButtonLike,
      Indicator: Wrap,
    },
    Toggle: {
      Root: ButtonLike,
    },
    ToggleGroup: {
      Root: Wrap,
      Item: ButtonLike,
    },
    Tooltip: {
      Provider: Wrap,
      Root: Wrap,
      Trigger: ButtonLike,
      Portal: Wrap,
      Content: Wrap,
      Arrow: Wrap,
    },
    Tabs: {
      Root: Wrap,
      List: Wrap,
      Trigger: ButtonLike,
      Content: Wrap,
    },
    Dialog: {
      Root: Wrap,
      Trigger: ButtonLike,
      Close: ButtonLike,
      Portal: Wrap,
      Overlay: Wrap,
      Content: Wrap,
      Title: Wrap,
      Description: Wrap,
    },
  };
});

vi.mock("vaul", () => {
  const Wrap = ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => (
    <div {...props}>{children}</div>
  );
  const ButtonLike = ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => (
    <button type="button" {...props}>{children}</button>
  );

  return {
    Drawer: {
      Root: Wrap,
      Trigger: ButtonLike,
      Portal: Wrap,
      Close: ButtonLike,
      Overlay: Wrap,
      Content: Wrap,
      Title: Wrap,
      Description: Wrap,
    },
  };
});

const toasterSpy = vi.fn(({ children }: { children?: ReactNode }) => <div data-testid="sonner">{children}</div>);

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark" }),
}));

vi.mock("sonner", () => ({
  Toaster: (props: unknown) => toasterSpy(props as never),
}));

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { LocalDateTime } from "@/components/ui/local-date-time";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

describe("extended ui primitives", () => {
  it("renders avatar and breadcrumb components", () => {
    render(
      <>
        <Avatar size="lg">
          <AvatarImage alt="user" />
          <AvatarFallback>AB</AvatarFallback>
          <AvatarBadge>+</AvatarBadge>
        </Avatar>
        <AvatarGroup>
          <Avatar />
          <AvatarGroupCount>+2</AvatarGroupCount>
        </AvatarGroup>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Page</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
      </>,
    );

    expect(screen.getByAltText("user")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Page")).toBeInTheDocument();
  });

  it("renders select/dropdown/checkbox/tabs/toggle/tooltip", async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();

    render(
      <>
        <Select>
          <SelectTrigger><SelectValue>v</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group</SelectLabel>
              <SelectItem value="1">One</SelectItem>
              <SelectSeparator />
            </SelectGroup>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Menu</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>Item</DropdownMenuItem>
              <DropdownMenuCheckboxItem checked>Checked</DropdownMenuCheckboxItem>
              <DropdownMenuRadioGroup value="a">
                <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Sub</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>Sub content</DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>

        <Checkbox checked onCheckedChange={onCheck} />

        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">A</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Content</TabsContent>
        </Tabs>

        <Toggle>Toggle</Toggle>
        <ToggleGroup type="single">
          <ToggleGroupItem value="1">One</ToggleGroupItem>
        </ToggleGroup>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Tip</TooltipTrigger>
            <TooltipContent>Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getAllByRole("button")[1]);

    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Tooltip")).toBeInTheDocument();
  });

  it("renders sheet and drawer components", () => {
    render(
      <>
        <Sheet>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet title</SheetTitle>
              <SheetDescription>Sheet desc</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose>Close</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Drawer>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer title</DrawerTitle>
              <DrawerDescription>Drawer desc</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose>Close Drawer</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>,
    );

    expect(screen.getByText("Sheet title")).toBeInTheDocument();
    expect(screen.getByText("Drawer title")).toBeInTheDocument();
  });

  it("formats local datetime and renders toaster", () => {
    render(
      <>
        <LocalDateTime value="invalid-date" fallback="-" />
        <LocalDateTime value="2026-03-05T00:00:00.000Z" locale="en-US" />
        <Toaster />
      </>,
    );

    expect(document.body.textContent).toContain("-");
    expect(screen.getByTestId("sonner")).toBeInTheDocument();
    expect(toasterSpy).toHaveBeenCalled();
  });
});
