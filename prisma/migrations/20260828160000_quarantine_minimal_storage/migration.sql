-- Store minimal quarantine fields instead of full Postmark JSON (privacy).
ALTER TABLE "QuarantinedInbound" ADD COLUMN "textBody" TEXT NOT NULL DEFAULT '';
ALTER TABLE "QuarantinedInbound" ADD COLUMN "htmlBody" TEXT;
ALTER TABLE "QuarantinedInbound" ADD COLUMN "toAddresses" TEXT NOT NULL DEFAULT '';
ALTER TABLE "QuarantinedInbound" ADD COLUMN "messageDate" TIMESTAMP(3);
ALTER TABLE "QuarantinedInbound" ADD COLUMN "attachmentCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "QuarantinedInbound"
SET
  "textBody" = COALESCE("payloadJson"->>'TextBody', ''),
  "htmlBody" = LEFT("payloadJson"->>'HtmlBody', 50000),
  "toAddresses" = COALESCE("payloadJson"->>'To', ''),
  "messageDate" = CASE
    WHEN "payloadJson"->>'Date' IS NOT NULL AND "payloadJson"->>'Date' <> ''
    THEN ("payloadJson"->>'Date')::timestamptz
    ELSE NULL
  END,
  "attachmentCount" = COALESCE(jsonb_array_length("payloadJson"->'Attachments'), 0)
WHERE "payloadJson" IS NOT NULL;

ALTER TABLE "QuarantinedInbound" DROP COLUMN "payloadJson";
