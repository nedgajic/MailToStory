export class GoogleReconnectRequiredError extends Error {
  readonly code = "GOOGLE_RECONNECT_REQUIRED" as const;

  constructor(
    message = "Your Gmail connection expired. Reconnect Google to load your inbox.",
  ) {
    super(message);
    this.name = "GoogleReconnectRequiredError";
  }
}

export function isInvalidGrantError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const msg =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  if (msg.includes("invalid_grant")) return true;
  const response =
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
      ? error.response.data
      : null;
  return (
    !!response &&
    typeof response === "object" &&
    "error" in response &&
    response.error === "invalid_grant"
  );
}
