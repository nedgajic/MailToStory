export function inboundDomain(): string {
  return (
    process.env.POSTMARK_INBOUND_DOMAIN?.trim() || "inbox.mailtostory.com"
  );
}

export function inboundAddress(localPart: string): string {
  return `${localPart}@${inboundDomain()}`;
}
