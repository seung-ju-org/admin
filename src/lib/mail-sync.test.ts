// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const sshState = vi.hoisted(() => ({
  command: "",
  connectCalls: 0,
  connectOptions: null as null | Record<string, unknown>,
}));

vi.mock("ssh2", () => {
  class MockClient {
    private handlers: Record<string, (...args: unknown[]) => void> = {};

    on(event: string, handler: (...args: unknown[]) => void) {
      this.handlers[event] = handler;
      return this;
    }

    exec(
      command: string,
      callback: (
        error: Error | null,
        stream: {
          on: (event: string, handler: (arg?: unknown) => void) => unknown;
          stderr: { on: (event: string, handler: (arg?: unknown) => void) => unknown };
        },
      ) => void,
    ) {
      sshState.command = command;

      const streamHandlers: Record<string, (arg?: unknown) => void> = {};
      const stderrHandlers: Record<string, (arg?: unknown) => void> = {};

      callback(null, {
        on: (event: string, handler: (arg?: unknown) => void) => {
          streamHandlers[event] = handler;
          if (event === "close") {
            setTimeout(() => handler(0), 0);
          }
          return null;
        },
        stderr: {
          on: (event: string, handler: (arg?: unknown) => void) => {
            stderrHandlers[event] = handler;
            return null;
          },
        },
      });
    }

    connect(options: Record<string, unknown>) {
      sshState.connectCalls += 1;
      sshState.connectOptions = options;
      setTimeout(() => {
        this.handlers.ready?.();
      }, 0);
      return this;
    }

    end() {
      return undefined;
    }
  }

  return { Client: MockClient };
});

describe("mail-sync", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    sshState.command = "";
    sshState.connectCalls = 0;
    sshState.connectOptions = null;
  });

  it("returns required flag from environment", async () => {
    vi.stubEnv("MAIL_SYNC_REQUIRED", "true");

    const mailSyncModule = await import("@/lib/mail-sync");

    expect(mailSyncModule.isMailSyncRequired()).toBe(true);
  });

  it("syncs CREATE action with email mailbox", async () => {
    vi.stubEnv("MAIL_SYNC_SSH_HOST", "seung-ju.com");
    vi.stubEnv("MAIL_SYNC_SSH_USER", "root");
    vi.stubEnv("MAIL_SYNC_SSH_PASSWORD", "pw");
    vi.stubEnv("MAIL_SYNC_SSH_COMMAND_CREATE", "echo add {{mailbox}} {{password}}");

    const mailSyncModule = await import("@/lib/mail-sync");

    await mailSyncModule.syncMailUser({
      action: "CREATE",
      user: {
        id: "u1",
        username: "admin",
        email: "admin@custom.com",
        password: "secret",
      },
    });

    expect(sshState.connectCalls).toBe(1);
    expect(sshState.command).toContain("'admin@custom.com'");
    expect(sshState.command).toContain("'secret'");
  });

  it("skips UPDATE when password is empty and template needs password", async () => {
    vi.stubEnv("MAIL_SYNC_SSH_HOST", "seung-ju.com");
    vi.stubEnv("MAIL_SYNC_SSH_USER", "root");
    vi.stubEnv("MAIL_SYNC_SSH_COMMAND_UPDATE", "echo update {{mailbox}} {{password}}");

    const mailSyncModule = await import("@/lib/mail-sync");

    await mailSyncModule.syncMailUser({
      action: "UPDATE",
      user: {
        id: "u1",
        username: "admin",
      },
    });

    expect(sshState.connectCalls).toBe(0);
    expect(sshState.command).toBe("");
  });

  it("uses username+domain when email is absent", async () => {
    vi.stubEnv("MAIL_SYNC_SSH_HOST", "seung-ju.com");
    vi.stubEnv("MAIL_SYNC_SSH_USER", "root");
    vi.stubEnv("MAIL_SYNC_EMAIL_DOMAIN", "example.com");
    vi.stubEnv("MAIL_SYNC_SSH_COMMAND_DELETE", "echo del {{mailbox}}");

    const mailSyncModule = await import("@/lib/mail-sync");

    await mailSyncModule.syncMailUser({
      action: "DELETE",
      user: {
        id: "u1",
        username: "jane",
      },
    });

    expect(sshState.command).toContain("'jane@example.com'");
  });

  it("no-ops when ssh host or user is missing", async () => {
    vi.stubEnv("MAIL_SYNC_SSH_COMMAND_CREATE", "echo add {{mailbox}}");

    const mailSyncModule = await import("@/lib/mail-sync");

    await mailSyncModule.syncMailUser({
      action: "CREATE",
      user: {
        id: "u1",
        username: "admin",
      },
    });

    expect(sshState.connectCalls).toBe(0);
  });
});
