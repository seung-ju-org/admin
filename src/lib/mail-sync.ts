import { Client } from "ssh2";

type MailSyncAction = "CREATE" | "UPDATE" | "DELETE";

type MailSyncPayload = {
  action: MailSyncAction;
  user: {
    id: string;
    username: string;
    email?: string | null;
    name?: string | null;
    password?: string;
    role?: "ADMIN" | "USER";
  };
};

const MAIL_SYNC_SSH_HOST = process.env.MAIL_SYNC_SSH_HOST;
const MAIL_SYNC_SSH_PORT = Number(process.env.MAIL_SYNC_SSH_PORT ?? "22");
const MAIL_SYNC_SSH_USER = process.env.MAIL_SYNC_SSH_USER;
const MAIL_SYNC_SSH_PASSWORD = process.env.MAIL_SYNC_SSH_PASSWORD;
const MAIL_SYNC_SSH_KEY = process.env.MAIL_SYNC_SSH_KEY;
const MAIL_SYNC_SSH_TIMEOUT_MS = Number(process.env.MAIL_SYNC_SSH_TIMEOUT_MS ?? "10000");
const MAIL_SYNC_REQUIRED = process.env.MAIL_SYNC_REQUIRED === "true";
const MAIL_SYNC_EMAIL_DOMAIN = process.env.MAIL_SYNC_EMAIL_DOMAIN ?? "seung-ju.com";

export function isMailSyncRequired() {
  return MAIL_SYNC_REQUIRED;
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function getMailbox(user: MailSyncPayload["user"]) {
  if (user.email && user.email.includes("@")) {
    return user.email;
  }
  return `${user.username}@${MAIL_SYNC_EMAIL_DOMAIN}`;
}

function buildCommand(payload: MailSyncPayload): string | null {
  const templateByAction: Record<MailSyncAction, string> = {
    CREATE:
      "kubectl -n mail exec deploy/mail-docker-mailserver -- setup email add {{mailbox}} {{password}}",
    UPDATE:
      "kubectl -n mail exec deploy/mail-docker-mailserver -- setup email update {{mailbox}} {{password}}",
    DELETE: "kubectl -n mail exec deploy/mail-docker-mailserver -- setup email del {{mailbox}}",
  };

  const template = templateByAction[payload.action];

  const password = payload.user.password?.trim() ?? "";
  if (payload.action === "UPDATE" && !password) {
    if (template.includes("{{password}}")) {
      return null;
    }
  }

  const mailbox = getMailbox(payload.user);
  const replacements: Record<string, string> = {
    action: shellQuote(payload.action),
    id: shellQuote(payload.user.id),
    username: shellQuote(payload.user.username),
    email: shellQuote(payload.user.email ?? ""),
    mailbox: shellQuote(mailbox),
    name: shellQuote(payload.user.name ?? ""),
    password: shellQuote(password),
    role: shellQuote(payload.user.role ?? ""),
  };

  return template.replace(
    /\{\{(action|id|username|email|mailbox|name|password|role)\}\}/g,
    (_, key) => replacements[key] ?? "''",
  );
}

async function executeSshCommand(command: string) {
  if (!MAIL_SYNC_SSH_HOST || !MAIL_SYNC_SSH_USER) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const conn = new Client();

    const endWithError = (error: Error) => {
      clearTimeout(timer);
      conn.end();
      reject(error);
    };

    const timer = setTimeout(() => {
      endWithError(new Error("MAIL_SYNC_FAILED: SSH_TIMEOUT"));
    }, MAIL_SYNC_SSH_TIMEOUT_MS);

    conn
      .on("ready", () => {
        conn.exec(command, (error, stream) => {
          if (error) {
            endWithError(error);
            return;
          }

          let stdout = "";
          let stderr = "";

          stream.on("data", (chunk: Buffer) => {
            stdout += chunk.toString();
          });

          stream.stderr.on("data", (chunk: Buffer) => {
            stderr += chunk.toString();
          });

          stream.on("close", (code: number | undefined) => {
            clearTimeout(timer);
            conn.end();

            if (code === 0) {
              resolve();
              return;
            }

            reject(
              new Error(
                `MAIL_SYNC_FAILED: SSH_EXIT_${code ?? "UNKNOWN"} ${stderr || stdout}`.trim(),
              ),
            );
          });
        });
      })
      .on("error", (error) => {
        endWithError(error);
      })
      .connect({
        host: MAIL_SYNC_SSH_HOST,
        port: MAIL_SYNC_SSH_PORT,
        username: MAIL_SYNC_SSH_USER,
        password: MAIL_SYNC_SSH_PASSWORD,
        privateKey: MAIL_SYNC_SSH_KEY,
        readyTimeout: MAIL_SYNC_SSH_TIMEOUT_MS,
      });
  });
}

export async function syncMailUser(payload: MailSyncPayload) {
  const command = buildCommand(payload);
  if (!command) {
    return;
  }
  await executeSshCommand(command);
}
