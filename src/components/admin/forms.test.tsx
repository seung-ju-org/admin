import type { ReactNode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@apollo/client/react", () => ({
  useQuery: mocks.useQuery,
  useMutation: mocks.useMutation,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  SelectValue: () => <span>select</span>,
}));

vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ checked, onCheckedChange, id }: { checked?: boolean; onCheckedChange?: (value: boolean) => void; id?: string }) => (
    <input
      aria-label={id ?? "checkbox"}
      checked={Boolean(checked)}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      type="checkbox"
    />
  ),
}));

import { CreateUserForm } from "@/components/admin/create-user-form";
import { EditUserForm } from "@/components/admin/edit-user-form";
import { CreateProjectForm } from "@/components/admin/create-project-form";
import { EditProjectForm } from "@/components/admin/edit-project-form";
import { CreateCareerForm } from "@/components/admin/create-career-form";
import { EditCareerForm } from "@/components/admin/edit-career-form";

const messages = new Proxy(
  {},
  {
    get: (_, property) => String(property),
  },
) as Record<string, string>;

describe("admin forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("creates user and redirects", async () => {
    const user = userEvent.setup();
    const createUser = vi.fn().mockResolvedValue({ data: { createUser: { id: "u1" } } });
    mocks.useMutation.mockReturnValue([createUser, { loading: false }]);

    render(<CreateUserForm messages={messages as never} />);

    await user.type(screen.getByLabelText("username"), " admin ");
    await user.type(screen.getByLabelText("email"), " admin@seung-ju.com ");
    await user.type(screen.getByLabelText("name"), " Admin ");
    await user.type(screen.getByLabelText("password"), "pw");
    await user.click(screen.getByRole("button", { name: "create" }));

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith({
        variables: {
          username: "admin",
          email: "admin@seung-ju.com",
          name: "Admin",
          password: "pw",
          role: "USER",
        },
      });
    });
    expect(mocks.push).toHaveBeenCalledWith("/admin/users");
  });

  it("loads and updates user", async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn().mockResolvedValue({ data: { updateUser: { id: "u1" } } });
    mocks.useQuery.mockReturnValue({
      data: {
        user: {
          id: "u1",
          username: "admin",
          email: "admin@seung-ju.com",
          name: "old",
          role: "ADMIN",
        },
      },
      loading: false,
      error: undefined,
    });
    mocks.useMutation.mockReturnValue([updateUser, { loading: false }]);

    render(<EditUserForm userId="u1" messages={messages as never} />);

    const nameInput = screen.getByLabelText("name");
    await user.clear(nameInput);
    await user.type(nameInput, "new-name");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({
        variables: {
          userId: "u1",
          name: "new-name",
          password: null,
        },
      });
    });
  });

  it("creates project with translations and technologies", async () => {
    const user = userEvent.setup();
    const createProject = vi.fn().mockResolvedValue({ data: { createProject: { id: "p1" } } });
    mocks.useMutation.mockReturnValue([createProject, { loading: false }]);

    render(<CreateProjectForm messages={messages as never} />);

    await user.type(screen.getByLabelText("slug"), "project-1");
    await user.type(screen.getByLabelText("startDate"), "2026-03-05");
    await user.type(screen.getByLabelText("technologies"), "Next.js, Prisma, GraphQL");

    const titleInput = screen.getByPlaceholderText("titlePlaceholder");
    const roleInput = screen.getByPlaceholderText("rolePlaceholder");
    await user.type(titleInput, "프로젝트");
    await user.type(roleInput, "개발");

    await user.click(screen.getByRole("button", { name: "create" }));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalled();
    });

    const call = createProject.mock.calls[0]?.[0];
    expect(call.variables.slug).toBe("project-1");
    expect(call.variables.technologyNames).toEqual(["Next.js", "Prisma", "GraphQL"]);
    expect(call.variables.translations[0]).toMatchObject({ locale: "KO", title: "프로젝트", role: "개발" });
  });

  it("updates project and redirects", async () => {
    const user = userEvent.setup();
    const updateProject = vi.fn().mockResolvedValue({ data: { updateProject: { id: "p1" } } });
    mocks.useMutation.mockReturnValue([updateProject, { loading: false }]);

    render(
      <EditProjectForm
        projectId="p1"
        messages={messages as never}
        initial={{
          slug: "project-1",
          displayOrder: 1,
          startDate: "2026-03-01",
          endDate: "",
          isOngoing: false,
          isPublished: true,
          links: "",
          technologies: "Next.js",
          titleKo: "타이틀",
          titleEn: "Title",
          titleJa: "タイトル",
          companyKo: "회사",
          companyEn: "Company",
          companyJa: "会社",
          roleKo: "개발",
          roleEn: "Dev",
          roleJa: "開発",
          achievementsKo: "[]",
          achievementsEn: "[]",
          achievementsJa: "[]",
        }}
      />,
    );

    const slugInput = screen.getByDisplayValue("project-1");
    await user.clear(slugInput);
    await user.type(slugInput, "project-1-edited");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalled();
    });

    const call = updateProject.mock.calls[0]?.[0];
    expect(call.variables.projectId).toBe("p1");
    expect(call.variables.slug).toBe("project-1-edited");
  });

  it("creates career with locale fallbacks", async () => {
    const user = userEvent.setup();
    const createCareer = vi.fn().mockResolvedValue({ data: { createCareer: { id: "c1" } } });
    mocks.useMutation.mockReturnValue([createCareer, { loading: false }]);

    render(<CreateCareerForm messages={messages as never} />);

    const dateInputs = document.querySelectorAll('input[type="date"]');
    await user.type(dateInputs[0] as HTMLInputElement, "2026-03-01");
    await user.type(screen.getByPlaceholderText("companyPlaceholder"), "Seung Ju");
    await user.type(screen.getByPlaceholderText("positionPlaceholder"), "Engineer");
    await user.click(screen.getByRole("button", { name: "create" }));

    await waitFor(() => {
      expect(createCareer).toHaveBeenCalled();
    });

    const call = createCareer.mock.calls[0]?.[0];
    expect(call.variables.translations[0]).toMatchObject({ locale: "KO", company: "Seung Ju", position: "Engineer" });
    expect(call.variables.translations[1].company).toBe("Seung Ju");
  });

  it("updates career", async () => {
    const user = userEvent.setup();
    const updateCareer = vi.fn().mockResolvedValue({ data: { updateCareer: { id: "c1" } } });
    mocks.useMutation.mockReturnValue([updateCareer, { loading: false }]);

    render(
      <EditCareerForm
        careerId="c1"
        messages={messages as never}
        initial={{
          startDate: "2026-03-01",
          endDate: "",
          isCurrent: true,
          displayOrder: 1,
          isPublished: true,
          companyKo: "회사",
          companyEn: "Company",
          companyJa: "会社",
          positionKo: "개발자",
          positionEn: "Developer",
          positionJa: "開発者",
          descriptionKo: "설명",
          descriptionEn: "Desc",
          descriptionJa: "説明",
        }}
      />,
    );

    const companyInput = screen.getByDisplayValue("회사");
    await user.clear(companyInput);
    await user.type(companyInput, "New Co");
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(updateCareer).toHaveBeenCalled();
    });

    const call = updateCareer.mock.calls[0]?.[0];
    expect(call.variables.careerId).toBe("c1");
    expect(call.variables.translations[0].company).toBe("New Co");
  });
});
