import { describe, expect, it } from "vitest";
import { stripTrackingNoiseFromProse } from "./stripTrackingNoiseFromProse";

describe("stripTrackingNoiseFromProse", () => {
  it("removes LinkedIn-style tracking blobs from prose", () => {
    const junk =
      'Premium.,4408767701&lipi=urn%3Ali%3Apage%3Aemail_email_job_alert_digest_01%3BbAd1%2FIpuTqmBXM8rSrrm8A%3D%3D&midToken=AQHy1oyAe3By0A&midSig=39O3kowk0x4Yg1&trk=eml-email_job_alert_digest_01-primary_job_list-0-see_all_jobs_text_ssid_4914125897_fmid_ad1xw3~momr4c8f~fe&trkEmail=eml-email_job_alert_digest_01-primary_job_list-0-see_all_jobs_text_ssid_4914125897_fmid_ad1xw3~momr4c8f~fe-null-ad1xw3~momr4c8f~fe-null-null&eid=ad1xw3-momr4c8f-fe&otpToken=MTQwNzE4ZTUxYTI5Y2FjMGIzMjQwNGVkNDExOWUxYjc4ZmNmZDk0NTkxYTg4ZTYxNmNjNjA5NmU0ZDVkNTRmM2YyZDBkNGU5MTdlZmI5ODI2M2FkYTJjMjBhOWViNGI2YWU2NGZkZTViMzc0MzQ4Y2M4ZDIzZjU0LDEsMQ%3D%3D';
    const input = `Several roles match your profile. ${junk} Apply soon.`;
    expect(stripTrackingNoiseFromProse(input)).toBe("Several roles match your profile. Apply soon.");
  });

  it("preserves normal sentences and short list items", () => {
    expect(
      stripTrackingNoiseFromProse(
        "We agreed to move the deadline to Friday. Thanks everyone.",
      ),
    ).toBe("We agreed to move the deadline to Friday. Thanks everyone.");
  });

  it("leaves short Vol.,12 style tokens", () => {
    expect(stripTrackingNoiseFromProse("See Vol.,12 for the figure.")).toBe(
      "See Vol.,12 for the figure.",
    );
  });

  it("strips orphan listing-id style tokens with long numeric tail", () => {
    expect(stripTrackingNoiseFromProse("Alert id Premium.,4408767701 only.")).toBe(
      "Alert id only.",
    );
  });
});
