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
