import {
  BRAND_LEGAL_ADDRESS,
  BRAND_LEGAL_ENTITY,
  BRAND_LEGAL_ENTITY_OFFICIAL,
  BRAND_REGISTRATION_NUMBER,
  BRAND_SUPPORT_EMAIL,
  BRAND_TAX_NUMBER,
  BRAND_VAT_REGISTERED,
} from "@/lib/brand";

export function OfficialLegalEntity({ showMarketingName = false }: { showMarketingName?: boolean }) {
  return (
    <>
      <p>
        <strong>{BRAND_LEGAL_ENTITY_OFFICIAL}</strong>
        <br />
        {BRAND_LEGAL_ADDRESS}
      </p>
      <ul>
        <li>
          Registration number (matična številka): {BRAND_REGISTRATION_NUMBER}
        </li>
        <li>Tax number (davčna številka): {BRAND_TAX_NUMBER}</li>
        <li>
          {BRAND_VAT_REGISTERED
            ? "Registered for VAT in Slovenia."
            : "Not registered for VAT in Slovenia (ni zavezanec za DDV)."}
        </li>
      </ul>
      {showMarketingName ? (
        <p>
          In everyday product copy we use the trade name <strong>{BRAND_LEGAL_ENTITY}</strong>.
        </p>
      ) : null}
      <p>
        Contact:{" "}
        <a href={`mailto:${BRAND_SUPPORT_EMAIL}`}>{BRAND_SUPPORT_EMAIL}</a>
      </p>
    </>
  );
}
