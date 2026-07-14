/** Display name from a MIME `From` header (e.g. `Name <a@b.com>`). */
export function parseFromDisplayName(fromHeader: string): string {
  const t = fromHeader.trim();
  if (!t) return "(unknown)";
  const lt = t.indexOf("<");
  if (lt !== -1) {
    const name = t
      .slice(0, lt)
      .replace(/^["'\s]+|["'\s]+$/g, "")
      .trim();
    if (name) return name;
    const rt = t.indexOf(">", lt);
    const email =
      rt === -1 ? t.slice(lt + 1) : t.slice(lt + 1, rt);
    return email.trim() || "(unknown)";
  }
  return t;
}

export function parseFromHeader(from: string): { name: string; email: string } {
  const trimmed = from.trim();
  if (!trimmed) return { name: "", email: "" };

  const named = trimmed.match(/^(.*?)\s*<([^>]+)>$/);
  if (named) {
    return {
      name: named[1].replace(/^["']|["']$/g, "").trim(),
      email: named[2].trim(),
    };
  }

  const angleOnly = trimmed.match(/^<([^>]+)>$/);
  if (angleOnly) return { name: "", email: angleOnly[1].trim() };

  if (trimmed.includes("@")) return { name: "", email: trimmed };
  return { name: "", email: "" };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isOwnerEmail(email: string, ownerEmail: string | undefined): boolean {
  if (!ownerEmail?.trim()) return false;
  return normalizeEmail(email) === normalizeEmail(ownerEmail);
}

function splitAddressList(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  let inAngle = false;

  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i]!;
    if (ch === '"' && !inAngle) {
      inQuotes = !inQuotes;
    } else if (ch === "<" && !inQuotes) {
      inAngle = true;
    } else if (ch === ">" && !inQuotes) {
      inAngle = false;
    } else if (ch === "," && !inQuotes && !inAngle) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function parseAddressList(header: string): { name: string; email: string }[] {
  const trimmed = header.trim();
  if (!trimmed) return [];

  return splitAddressList(trimmed)
    .map((part) => parseFromHeader(part))
    .filter((addr) => addr.email.includes("@"));
}

function displayNameForAddress(name: string, email: string): string {
  const trimmedName = name.trim();
  if (trimmedName) return trimmedName;
  const trimmedEmail = email.trim();
  return trimmedEmail || "(unknown)";
}

function addCorrespondent(
  byEmail: Map<string, string>,
  name: string,
  email: string,
  ownerEmail: string | undefined,
): void {
  if (!email || isOwnerEmail(email, ownerEmail)) return;

  const key = normalizeEmail(email);
  const nextDisplay = displayNameForAddress(name, email);
  const existing = byEmail.get(key);
  if (!existing || (existing === key && name.trim())) {
    byEmail.set(key, nextDisplay);
  }
}

type ThreadMessageHeaders = {
  payload?: {
    headers?: { name?: string | null; value?: string | null }[] | null;
  } | null;
};

function headerValue(
  message: ThreadMessageHeaders,
  name: string,
): string {
  const headers = message.payload?.headers ?? [];
  const found = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return found?.value ?? "";
}

/** Inbox-style label: other participants in the thread, never the mailbox owner. */
export function formatThreadCorrespondents(
  messages: ThreadMessageHeaders[],
  ownerEmail: string | undefined,
): string {
  const byEmail = new Map<string, string>();

  for (const message of messages) {
    const { name, email } = parseFromHeader(headerValue(message, "From"));
    addCorrespondent(byEmail, name, email, ownerEmail);
  }

  if (byEmail.size === 0 && messages.length > 0) {
    const last = messages[messages.length - 1]!;
    for (const headerName of ["To", "Cc"] as const) {
      for (const addr of parseAddressList(headerValue(last, headerName))) {
        addCorrespondent(byEmail, addr.name, addr.email, ownerEmail);
      }
    }
  }

  if (byEmail.size === 0) return "(unknown)";
  return Array.from(byEmail.values()).join(", ");
}
