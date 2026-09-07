import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  acceptAllCookies,
  getCookieConsent,
  hasCookieConsent,
  hasGivenCookieConsent,
  rejectNonEssentialCookies,
  resetCookieConsent,
  setCookieConsent,
} from "@/lib/cookie-consent";

function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("cookie-consent", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    resetCookieConsent();
    vi.unstubAllGlobals();
  });

  it("returns defaults when nothing is stored", () => {
    const consent = getCookieConsent();
    expect(consent.necessary).toBe(true);
    expect(consent.analytics).toBe(false);
    expect(consent.timestamp).toBeNull();
    expect(hasGivenCookieConsent(consent)).toBe(false);
  });

  it("persists accept-all preferences", () => {
    const saved = acceptAllCookies();
    expect(saved.analytics).toBe(true);
    expect(saved.timestamp).toBeTruthy();
    expect(hasGivenCookieConsent()).toBe(true);
    expect(hasCookieConsent("analytics")).toBe(true);
  });

  it("persists reject-non-essential preferences", () => {
    rejectNonEssentialCookies();
    expect(hasCookieConsent("analytics")).toBe(false);
    expect(hasGivenCookieConsent()).toBe(true);
  });

  it("always keeps necessary consent enabled", () => {
    setCookieConsent({ analytics: false, marketing: false, functional: false });
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { necessary: boolean };
    expect(parsed.necessary).toBe(true);
    expect(hasCookieConsent("necessary")).toBe(true);
  });
});
