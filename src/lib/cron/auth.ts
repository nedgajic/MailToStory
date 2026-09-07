export function cronAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  const header = req.headers.get("authorization")?.trim();
  if (header === `Bearer ${expected}`) return true;
  return req.headers.get("x-cron-secret") === expected;
}

export function cronUnauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
