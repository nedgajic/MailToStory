/** GA4 measurement ID — read on the server from `.env` at build or request time. */
export function getGaMeasurementId(): string | undefined {
  const id =
    process.env.GA_MEASUREMENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return id || undefined;
}
