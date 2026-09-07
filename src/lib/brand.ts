export const BRAND_NAME = "Mail To Story";
/** Wordmark shown beside the logo icon in headers and footers. */
export const BRAND_LOGO_TEXT = "Mail To Story";
export const BRAND_DOMAIN = "mailtostory.com";
export const BRAND_URL = `https://${BRAND_DOMAIN}`;

/** Public marketing / UI name. */
export const BRAND_LEGAL_ENTITY = "NEDix s.p.";
/** Official registered name — imprint, Privacy controller, Terms operator. */
export const BRAND_LEGAL_ENTITY_OFFICIAL = "NEDix, Nedeljko Gajić s.p.";
export const BRAND_LEGAL_ADDRESS = "Idrsko 3A, 5222 Kobarid, Slovenia";
export const BRAND_REGISTRATION_NUMBER = "7373414000";
export const BRAND_TAX_NUMBER = "15526399";
export const BRAND_VAT_REGISTERED = false;

/** Contact for privacy, support, billing, and legal inquiries. */
export const BRAND_SUPPORT_EMAIL = "support@mailtostory.com";

export const BRAND_PRIVACY_PATH = "/privacy";
export const BRAND_TERMS_PATH = "/terms";
export const BRAND_COOKIE_PATH = "/cookies";
export const BRAND_DATA_REQUEST_PATH = "/data-request";
export const BRAND_IMPRINT_PATH = "/imprint";
export const BRAND_REFUNDS_PATH = "/refunds";
export const BRAND_DPA_PATH = "/dpa";
export const BRAND_SUBPROCESSORS_PATH = "/subprocessors";
export const BRAND_HELP_PATH = "/help";

export const BRAND_PRIVACY_URL = `${BRAND_URL}/privacy`;
export const BRAND_TERMS_URL = `${BRAND_URL}/terms`;
export const BRAND_COOKIE_URL = `${BRAND_URL}/cookies`;
export const BRAND_DATA_REQUEST_URL = `${BRAND_URL}/data-request`;
export const BRAND_IMPRINT_URL = `${BRAND_URL}/imprint`;
export const BRAND_REFUNDS_URL = `${BRAND_URL}/refunds`;
export const BRAND_DPA_URL = `${BRAND_URL}/dpa`;
export const BRAND_SUBPROCESSORS_URL = `${BRAND_URL}/subprocessors`;
export const BRAND_HELP_URL = `${BRAND_URL}/help`;

export const LEGAL_NAV_LINKS = [
  { path: BRAND_PRIVACY_PATH, label: "Privacy Policy" },
  { path: BRAND_COOKIE_PATH, label: "Cookie Policy" },
  { path: BRAND_TERMS_PATH, label: "Terms of Service" },
  { path: BRAND_REFUNDS_PATH, label: "Refunds" },
  { path: BRAND_IMPRINT_PATH, label: "Imprint" },
  { path: BRAND_SUBPROCESSORS_PATH, label: "Subprocessors" },
  { path: BRAND_DPA_PATH, label: "DPA" },
  { path: BRAND_DATA_REQUEST_PATH, label: "Data Request" },
] as const;

export const HELP_NAV_LINK = { path: BRAND_HELP_PATH, label: "Help center" } as const;

export const BRAND_SLUG = "mailtostory";
export const BRAND_ICON_PATH = "/mailtostory-logo.png";
export const BRAND_OG_PATH = "/og.png";
export const BRAND_OG_URL = `${BRAND_URL}/og.png`;

export const BRAND_EXPORT_ATTRIBUTION = `Exported from ${BRAND_NAME} (${BRAND_URL}). Generated content — verify against originals.`;
export const BRAND_EXPORT_FOOTER = `${BRAND_NAME} · ${BRAND_DOMAIN}`;
