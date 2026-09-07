"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy /settings/profile#forwarding links → Email & forwarding. */
export function ProfileForwardingHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (window.location.hash === "#forwarding") {
      router.replace("/settings/email#forwarding");
    }
  }, [router]);

  return null;
}
